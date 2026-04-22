import { schema as s } from "@nawadi/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";

// Chat scope discriminated union — keep in sync with LeercoachChatScope in
// @nawadi/db. Duplicated here to keep consumers from having to import from
// two packages.
//
// Rule from Q1 decision (leercoach-pivot.md):
//   N3 kandidaten always use full_profiel.
//   N4/N5 kandidaten pick: full_profiel | kerntaak | kerntaken.
export const leercoachChatScopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("full_profiel") }),
  z.object({ type: z.literal("kerntaak"), kerntaakCode: z.string().min(1) }),
  z.object({
    type: z.literal("kerntaken"),
    kerntaakCodes: z.array(z.string().min(1)).min(1),
  }),
]);

// Phase of a leercoach chat — explicit workflow the model + user
// negotiate. Mirrors the leercoach.chat_phase enum in the DB schema.
export const leercoachChatPhaseSchema = z.enum([
  "verkennen",
  "ordenen",
  "concept",
  "verfijnen",
]);
export type LeercoachChatPhase = z.infer<typeof leercoachChatPhaseSchema>;

// ---- Create: portfolio-sessie (profiel-bound) ----
//
// Low-level primitive: takes an explicit profielId + scope. The
// portfolio attachment is the caller's responsibility — this only
// inserts the chat row. Prefer `createPortfolioChat` below for the
// typical "start a new chat for this portfolio" flow; it handles the
// portfolio lookup + attachment in one transaction.

export const createChatInput = z.object({
  userId: uuidSchema,
  profielId: uuidSchema,
  scope: leercoachChatScopeSchema,
  /**
   * Required for richting=instructeur chats, must be null otherwise.
   * Not validated here — the portfolio attachment layer enforces the
   * pairing. This low-level primitive just writes whatever it's given.
   */
  instructieGroepId: uuidSchema.nullable().default(null),
  title: z.string().default(""),
});

export const createChatOutput = z.object({
  chatId: uuidSchema,
});

export const create = wrapCommand(
  "leercoach.chat.create",
  withZod(createChatInput, createChatOutput, async (input) => {
    return withTransaction(async (tx) => {
      const inserted = await tx
        .insert(s.leercoachChat)
        .values({
          userId: input.userId,
          profielId: input.profielId,
          scope: input.scope,
          instructieGroepId: input.instructieGroepId,
          title: input.title,
        })
        .returning({ id: s.leercoachChat.id })
        .then((r) => r[0]);

      if (!inserted) {
        throw new Error("Insert leercoach.chat returned no rows");
      }

      return { chatId: inserted.id };
    });
  }),
);

// ---- Create: vraag-sessie (Q&A, no profiel) ----
//
// Pure ask-a-question chat with no portfolio binding. profielId +
// scope + portfolioId are all null; title starts empty and gets
// filled in from the first user turn (client-side, same pattern the
// title-generation endpoint uses for portfolio chats).

export const createQAChatInput = z.object({
  userId: uuidSchema,
  title: z.string().default(""),
});

export const createQAChat = wrapCommand(
  "leercoach.chat.createQAChat",
  withZod(createQAChatInput, createChatOutput, async (input) => {
    return withTransaction(async (tx) => {
      const inserted = await tx
        .insert(s.leercoachChat)
        .values({
          userId: input.userId,
          profielId: null,
          scope: null,
          title: input.title,
        })
        .returning({ id: s.leercoachChat.id })
        .then((r) => r[0]);

      if (!inserted) {
        throw new Error("Insert leercoach.chat returned no rows");
      }

      return { chatId: inserted.id };
    });
  }),
);

// ---- Create: portfolio-sessie bound to existing portfolio ----
//
// Convenience flow: given a portfolioId, resolve its profielId + scope,
// create the chat with those values, and wire chat.portfolio_id to the
// portfolio in one transaction. Fails loudly when the portfolio is not
// owned by userId so callers can't probe across users.

export const createPortfolioChatInput = z.object({
  userId: uuidSchema,
  portfolioId: uuidSchema,
  title: z.string().default(""),
});

export const createPortfolioChat = wrapCommand(
  "leercoach.chat.createPortfolioChat",
  withZod(createPortfolioChatInput, createChatOutput, async (input) => {
    return withTransaction(async (tx) => {
      // Ownership + shape lookup in one statement. instructieGroepId
      // joins so the chat row inherits it automatically.
      const portfolio = await tx
        .select({
          id: s.leercoachPortfolio.id,
          profielId: s.leercoachPortfolio.profielId,
          scope: s.leercoachPortfolio.scope,
          instructieGroepId: s.leercoachPortfolio.instructieGroepId,
        })
        .from(s.leercoachPortfolio)
        .where(
          and(
            eq(s.leercoachPortfolio.id, input.portfolioId),
            eq(s.leercoachPortfolio.userId, input.userId),
            isNull(s.leercoachPortfolio.deletedAt),
          ),
        )
        .limit(1)
        .then((r) => r[0]);

      if (!portfolio) {
        throw new Error("Portfolio niet gevonden of niet van deze gebruiker.");
      }

      const inserted = await tx
        .insert(s.leercoachChat)
        .values({
          userId: input.userId,
          profielId: portfolio.profielId,
          scope: portfolio.scope,
          instructieGroepId: portfolio.instructieGroepId,
          portfolioId: portfolio.id,
          title: input.title,
        })
        .returning({ id: s.leercoachChat.id })
        .then((r) => r[0]);

      if (!inserted) {
        throw new Error("Insert leercoach.chat returned no rows");
      }

      return { chatId: inserted.id };
    });
  }),
);

// ---- Read: single chat, user-scoped ----

export const getChatByIdInput = z.object({
  chatId: uuidSchema,
  userId: uuidSchema,
});

export const getChatByIdOutput = z
  .object({
    chatId: uuidSchema,
    userId: uuidSchema,
    /**
     * Null for Q&A-sessies (chats started without a profiel-bound
     * portfolio). Set for portfolio-sessies and after a Q&A chat is
     * promoted via the promote flow. Always matches the attached
     * portfolio's profielId when portfolioId is non-null.
     */
    profielId: uuidSchema.nullable(),
    /**
     * Null when profielId is null (scope only has meaning with a
     * profiel). Set to a discriminated-union value otherwise.
     */
    scope: leercoachChatScopeSchema.nullable(),
    /**
     * Inherited from the attached portfolio. Non-null only for
     * richting=instructeur portfolio-sessies; always null for Q&A
     * chats and for leercoach / pvb_beoordelaar portfolios.
     */
    instructieGroepId: uuidSchema.nullable(),
    phase: leercoachChatPhaseSchema,
    title: z.string(),
    visibility: z.enum(["private", "public"]),
    createdAt: z.string(),
    updatedAt: z.string(),
    /**
     * Portfolio document this chat is attached to. Null for legacy
     * chats created before the portfolio model landed; a one-time
     * backfill attaches those. New chats get a portfolio_id at
     * creation time via Portfolio.resolveOrCreate.
     */
    portfolioId: uuidSchema.nullable(),
    /**
     * Resumable-stream bookkeeping. See leercoach/chat schema for the
     * lifecycle: set by consumeSseStream, cleared by onFinish and by
     * the DELETE /stream endpoint. Nullable — absent = no stream is
     * currently in-flight for this chat.
     */
    activeStreamId: z.string().nullable(),
    /**
     * Non-null when the user clicked Stop. The in-flight streamText
     * polls this row (throttled) and aborts server-side when set.
     * Cleared at the top of the next POST so a stale cancel doesn't
     * kill the follow-up turn.
     */
    canceledAt: z.string().nullable(),
  })
  .nullable();

/**
 * Fetch one chat, scoped to the requesting user. Returns null when the chat
 * does not exist OR belongs to a different user — never throws on mismatch so
 * callers can't probe for chat existence across users.
 */
export const getById = wrapQuery(
  "leercoach.chat.getById",
  withZod(getChatByIdInput, getChatByIdOutput, async (input) => {
    const query = useQuery();
    const row = await query
      .select({
        id: s.leercoachChat.id,
        userId: s.leercoachChat.userId,
        profielId: s.leercoachChat.profielId,
        scope: s.leercoachChat.scope,
        instructieGroepId: s.leercoachChat.instructieGroepId,
        phase: s.leercoachChat.phase,
        title: s.leercoachChat.title,
        visibility: s.leercoachChat.visibility,
        createdAt: s.leercoachChat.createdAt,
        updatedAt: s.leercoachChat.updatedAt,
        activeStreamId: s.leercoachChat.activeStreamId,
        canceledAt: s.leercoachChat.canceledAt,
        portfolioId: s.leercoachChat.portfolioId,
      })
      .from(s.leercoachChat)
      .where(
        and(
          eq(s.leercoachChat.id, input.chatId),
          eq(s.leercoachChat.userId, input.userId),
          isNull(s.leercoachChat.deletedAt),
        ),
      )
      .limit(1)
      .then((r) => r[0]);

    if (!row) return null;
    return {
      chatId: row.id,
      userId: row.userId,
      profielId: row.profielId,
      scope: row.scope,
      instructieGroepId: row.instructieGroepId,
      phase: row.phase,
      title: row.title,
      visibility: row.visibility,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      activeStreamId: row.activeStreamId,
      canceledAt: row.canceledAt,
      portfolioId: row.portfolioId,
    };
  }),
);

// ---- Read: all chats for a user, newest first ----

export const listChatsByUserIdInput = z.object({
  userId: uuidSchema,
  limit: z.number().int().min(1).max(100).default(50),
});

export const listChatsByUserIdOutput = z.array(
  z.object({
    chatId: uuidSchema,
    /** Null for Q&A-sessies. See getChatByIdOutput for semantics. */
    profielId: uuidSchema.nullable(),
    /** Null when profielId is null. */
    scope: leercoachChatScopeSchema.nullable(),
    title: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export const listByUserId = wrapQuery(
  "leercoach.chat.listByUserId",
  withZod(listChatsByUserIdInput, listChatsByUserIdOutput, async (input) => {
    const query = useQuery();
    const rows = await query
      .select({
        id: s.leercoachChat.id,
        profielId: s.leercoachChat.profielId,
        scope: s.leercoachChat.scope,
        title: s.leercoachChat.title,
        createdAt: s.leercoachChat.createdAt,
        updatedAt: s.leercoachChat.updatedAt,
      })
      .from(s.leercoachChat)
      .where(
        and(
          eq(s.leercoachChat.userId, input.userId),
          isNull(s.leercoachChat.deletedAt),
        ),
      )
      .orderBy(desc(s.leercoachChat.updatedAt))
      .limit(input.limit);

    return rows.map((r) => ({
      chatId: r.id,
      profielId: r.profielId,
      scope: r.scope,
      title: r.title,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }),
);

// ---- Read: Q&A chats for a user (no profiel) ----
//
// Powers the "Vragen & verkenning" section on the leercoach index
// page. Same shape as listByUserId but filtered to chats where
// profielId IS NULL. Title is not null-checked here — Q&A chats can
// have empty titles (the first-turn title generator fills them in).

export const listQAChatsByUserIdInput = z.object({
  userId: uuidSchema,
  limit: z.number().int().min(1).max(100).default(50),
});

export const listQAChatsByUserIdOutput = z.array(
  z.object({
    chatId: uuidSchema,
    title: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export const listQAChatsByUserId = wrapQuery(
  "leercoach.chat.listQAChatsByUserId",
  withZod(
    listQAChatsByUserIdInput,
    listQAChatsByUserIdOutput,
    async (input) => {
      const query = useQuery();
      const rows = await query
        .select({
          id: s.leercoachChat.id,
          title: s.leercoachChat.title,
          createdAt: s.leercoachChat.createdAt,
          updatedAt: s.leercoachChat.updatedAt,
        })
        .from(s.leercoachChat)
        .where(
          and(
            eq(s.leercoachChat.userId, input.userId),
            isNull(s.leercoachChat.profielId),
            isNull(s.leercoachChat.deletedAt),
          ),
        )
        .orderBy(desc(s.leercoachChat.updatedAt))
        .limit(input.limit);

      return rows.map((r) => ({
        chatId: r.id,
        title: r.title,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    },
  ),
);

// ---- Read: chats attached to a specific portfolio ----
//
// Powers the portfolio detail page's "Sessies" list. Ownership check
// lives on the portfolio row — the chat-user join would be redundant
// since portfolio.user_id + chat.portfolio_id uniquely identify the
// relevant set.

export const listChatsByPortfolioIdInput = z.object({
  portfolioId: uuidSchema,
  userId: uuidSchema,
  limit: z.number().int().min(1).max(100).default(50),
});

export const listChatsByPortfolioIdOutput = z.array(
  z.object({
    chatId: uuidSchema,
    title: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
);

export const listByPortfolioId = wrapQuery(
  "leercoach.chat.listByPortfolioId",
  withZod(
    listChatsByPortfolioIdInput,
    listChatsByPortfolioIdOutput,
    async (input) => {
      const query = useQuery();
      const rows = await query
        .select({
          id: s.leercoachChat.id,
          title: s.leercoachChat.title,
          createdAt: s.leercoachChat.createdAt,
          updatedAt: s.leercoachChat.updatedAt,
        })
        .from(s.leercoachChat)
        .where(
          and(
            eq(s.leercoachChat.portfolioId, input.portfolioId),
            eq(s.leercoachChat.userId, input.userId),
            isNull(s.leercoachChat.deletedAt),
          ),
        )
        .orderBy(desc(s.leercoachChat.updatedAt))
        .limit(input.limit);

      return rows.map((r) => ({
        chatId: r.id,
        title: r.title,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    },
  ),
);

// ---- Update: rename ----

export const updateChatTitleInput = z.object({
  chatId: uuidSchema,
  userId: uuidSchema,
  title: z.string().min(1).max(200),
});

export const updateTitle = wrapCommand(
  "leercoach.chat.updateTitle",
  withZod(updateChatTitleInput, z.void(), async (input) => {
    return withTransaction(async (tx) => {
      await tx
        .update(s.leercoachChat)
        .set({ title: input.title, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(s.leercoachChat.id, input.chatId),
            eq(s.leercoachChat.userId, input.userId),
          ),
        );
    });
  }),
);

// ---- Update: scope ----

export const updateScopeInput = z.object({
  chatId: uuidSchema,
  userId: uuidSchema,
  scope: leercoachChatScopeSchema,
  /** Optional new title; if omitted, existing title is preserved. */
  title: z.string().min(1).max(200).optional(),
});

/**
 * Change the scope of an existing chat. Used when a kandidaat realises
 * partway through a session that they actually want to focus on a single
 * kerntaak instead of their full profiel (or vice versa). Touches updatedAt
 * so the session bubbles to the top of the sidebar.
 *
 * The scope change itself does not rewrite message history — callers can
 * save an informational assistant/system message noting the transition.
 */
export const updateScope = wrapCommand(
  "leercoach.chat.updateScope",
  withZod(updateScopeInput, z.void(), async (input) => {
    return withTransaction(async (tx) => {
      const patch: {
        scope: typeof input.scope;
        updatedAt: string;
        title?: string;
      } = {
        scope: input.scope,
        updatedAt: new Date().toISOString(),
      };
      if (input.title) patch.title = input.title;
      await tx
        .update(s.leercoachChat)
        .set(patch)
        .where(
          and(
            eq(s.leercoachChat.id, input.chatId),
            eq(s.leercoachChat.userId, input.userId),
          ),
        );
    });
  }),
);

// ---- Promote: Q&A-sessie → portfolio-sessie ----
//
// One-way latch: binds a vraag-sessie to a profiel + scope + portfolio
// without touching message history. Caller is responsible for
// resolve-or-creating the portfolio BEFORE calling this (kept separate
// so core doesn't bundle its own portfolio resolver reference; the
// resolveOrCreate call at the action layer uses the public Portfolio
// API).
//
// Guards:
//   - Chat must exist and belong to userId (ownership check).
//   - Chat must currently be a Q&A-sessie (profielId IS NULL) —
//     re-promoting a portfolio chat to a different portfolio is
//     explicitly unsupported. Users who want to move "work" between
//     portfolios start a new chat on the target portfolio.
//
// Touches updatedAt so the freshly-promoted chat bubbles to the top
// of the portfolio's session list.

export const promoteChatToPortfolioInput = z.object({
  chatId: uuidSchema,
  userId: uuidSchema,
  profielId: uuidSchema,
  scope: leercoachChatScopeSchema,
  /**
   * Set only when the target portfolio's profiel.richting is
   * "instructeur"; null otherwise. Caller is responsible for passing
   * the same value it used to resolve/create the portfolio — the two
   * MUST line up (enforced implicitly by the FK + the portfolio's own
   * invariant).
   */
  instructieGroepId: uuidSchema.nullable(),
  portfolioId: uuidSchema,
  /** Optional new title; if omitted, existing title is preserved. */
  title: z.string().min(1).max(200).optional(),
});

export const promoteToPortfolio = wrapCommand(
  "leercoach.chat.promoteToPortfolio",
  withZod(promoteChatToPortfolioInput, z.void(), async (input) => {
    return withTransaction(async (tx) => {
      const current = await tx
        .select({
          id: s.leercoachChat.id,
          profielId: s.leercoachChat.profielId,
        })
        .from(s.leercoachChat)
        .where(
          and(
            eq(s.leercoachChat.id, input.chatId),
            eq(s.leercoachChat.userId, input.userId),
            isNull(s.leercoachChat.deletedAt),
          ),
        )
        .limit(1)
        .then((r) => r[0]);
      if (!current) {
        throw new Error("Chat niet gevonden.");
      }
      if (current.profielId !== null) {
        throw new Error(
          "Deze chat is al gekoppeld aan een portfolio en kan niet opnieuw gekoppeld worden.",
        );
      }

      const patch: {
        profielId: string;
        scope: typeof input.scope;
        instructieGroepId: string | null;
        portfolioId: string;
        updatedAt: string;
        title?: string;
      } = {
        profielId: input.profielId,
        scope: input.scope,
        instructieGroepId: input.instructieGroepId,
        portfolioId: input.portfolioId,
        updatedAt: new Date().toISOString(),
      };
      if (input.title) patch.title = input.title;

      await tx
        .update(s.leercoachChat)
        .set(patch)
        .where(
          and(
            eq(s.leercoachChat.id, input.chatId),
            eq(s.leercoachChat.userId, input.userId),
          ),
        );
    });
  }),
);

// ---- Soft delete ----

export const softDeleteChatInput = z.object({
  chatId: uuidSchema,
  userId: uuidSchema,
});

/**
 * Soft delete: sets deleted_at. Messages remain in the DB for audit.
 * Implemented as soft delete (rather than CASCADE delete) so that we can
 * reverse accidental deletions and preserve the history for compliance.
 */
export const softDelete = wrapCommand(
  "leercoach.chat.softDelete",
  withZod(softDeleteChatInput, z.void(), async (input) => {
    return withTransaction(async (tx) => {
      await tx
        .update(s.leercoachChat)
        .set({ deletedAt: new Date().toISOString() })
        .where(
          and(
            eq(s.leercoachChat.id, input.chatId),
            eq(s.leercoachChat.userId, input.userId),
          ),
        );
    });
  }),
);

// ---- Update: phase ----

export const updateChatPhaseInput = z.object({
  chatId: uuidSchema,
  userId: uuidSchema,
  phase: leercoachChatPhaseSchema,
});

/**
 * Update the chat's workflow phase. Called both by the model's
 * setPhase tool (when it decides to advance / retreat) and by the
 * server action the stepper UI uses when a user accepts their own
 * earlier request. userId scoping defence-in-depth: a rogue chatId
 * shouldn't reach a different user's chat.
 *
 * Touches `updatedAt` so the chat bubbles to the top of the sidebar
 * when a phase shifts.
 */
export const updatePhase = wrapCommand(
  "leercoach.chat.updatePhase",
  withZod(updateChatPhaseInput, z.void(), async (input) => {
    return withTransaction(async (tx) => {
      await tx
        .update(s.leercoachChat)
        .set({
          phase: input.phase,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(s.leercoachChat.id, input.chatId),
            eq(s.leercoachChat.userId, input.userId),
          ),
        );
    });
  }),
);

// ---- Update: resumable-stream bookkeeping ----
//
// These three mutations power the POST / GET / DELETE /stream lifecycle.
// Intentionally scope-narrow (only touch the relevant columns) so they
// never race with updatePhase / updateTitle / updateScope on the same
// row.

export const setActiveStreamIdInput = z.object({
  chatId: uuidSchema,
  /** null clears the marker (end of turn, cancel). */
  streamId: z.string().nullable(),
});

/**
 * Write the active resumable-stream id for a chat. Called by the POST
 * route's `consumeSseStream` callback to record the stream we're
 * publishing into Redis, and called again by `onFinish` / the DELETE
 * /stream endpoint to clear it when the stream terminates.
 *
 * No userId scoping: the caller is an authenticated route that has
 * already verified ownership via getById. Scoping here too would
 * require an extra round trip on every stream event.
 */
export const setActiveStreamId = wrapCommand(
  "leercoach.chat.setActiveStreamId",
  withZod(setActiveStreamIdInput, z.void(), async (input) => {
    return withTransaction(async (tx) => {
      await tx
        .update(s.leercoachChat)
        .set({ activeStreamId: input.streamId })
        .where(eq(s.leercoachChat.id, input.chatId));
    });
  }),
);

export const markChatCanceledInput = z.object({
  chatId: uuidSchema,
  userId: uuidSchema,
});

/**
 * Set `canceledAt = now()`. The POST route's `streamText` call reads
 * this via a throttled `onChunk` callback (once per second) and aborts
 * the LLM stream server-side when it appears. userId scoping here
 * because this is called from the user-facing DELETE /stream endpoint.
 */
export const markCanceled = wrapCommand(
  "leercoach.chat.markCanceled",
  withZod(markChatCanceledInput, z.void(), async (input) => {
    return withTransaction(async (tx) => {
      await tx
        .update(s.leercoachChat)
        .set({ canceledAt: new Date().toISOString() })
        .where(
          and(
            eq(s.leercoachChat.id, input.chatId),
            eq(s.leercoachChat.userId, input.userId),
          ),
        );
    });
  }),
);

export const clearChatCanceledInput = z.object({
  chatId: uuidSchema,
});

/**
 * Null out `canceled_at`. Called at the start of each POST turn so a
 * stale cancel from a prior interaction doesn't kill the new stream
 * before it has a chance to emit.
 */
export const clearCanceled = wrapCommand(
  "leercoach.chat.clearCanceled",
  withZod(clearChatCanceledInput, z.void(), async (input) => {
    return withTransaction(async (tx) => {
      await tx
        .update(s.leercoachChat)
        .set({ canceledAt: null })
        .where(eq(s.leercoachChat.id, input.chatId));
    });
  }),
);
