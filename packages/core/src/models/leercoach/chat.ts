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

// ---- Create ----

export const createChatInput = z.object({
  userId: uuidSchema,
  profielId: uuidSchema,
  scope: leercoachChatScopeSchema,
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
    profielId: uuidSchema,
    scope: leercoachChatScopeSchema,
    title: z.string(),
    visibility: z.enum(["private", "public"]),
    createdAt: z.string(),
    updatedAt: z.string(),
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
        title: s.leercoachChat.title,
        visibility: s.leercoachChat.visibility,
        createdAt: s.leercoachChat.createdAt,
        updatedAt: s.leercoachChat.updatedAt,
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
      title: row.title,
      visibility: row.visibility,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
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
    profielId: uuidSchema,
    scope: leercoachChatScopeSchema,
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
