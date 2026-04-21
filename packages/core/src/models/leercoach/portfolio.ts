import { createHash } from "node:crypto";
import { schema as s } from "@nawadi/db";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";

// Portfolio document model — the canonical text the kandidaat is
// writing (with AI assistance). Separate from chat messages so:
//
//   1. Chat context stays small — drafts were the biggest context-
//      eater before (re-sent verbatim every turn). Moving them here
//      means compaction is mostly unnecessary.
//   2. Version history is explicit and immutable — every coach save
//      and every user edit creates a new row; nothing gets
//      overwritten. "Revert" is "create new version from old snapshot."
//   3. User-editing becomes trivial — the doc is the source of truth,
//      the coach just writes alongside the user.
//
// Scope identity: one portfolio per (user, profiel, scope). A new
// chat for the same scope re-attaches to the existing portfolio
// rather than creating a new one.

// Scope schema mirrors leercoach.chat.scope — both tables share the
// same discriminated union so resolveOrCreate can match exactly.
export const leercoachPortfolioScopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("full_profiel") }),
  z.object({ type: z.literal("kerntaak"), kerntaakCode: z.string().min(1) }),
  z.object({
    type: z.literal("kerntaken"),
    kerntaakCodes: z.array(z.string().min(1)).min(1),
  }),
]);

export type LeercoachPortfolioScope = z.infer<
  typeof leercoachPortfolioScopeSchema
>;

const portfolioVersionCreatedBySchema = z.enum([
  "coach",
  "user",
  "imported",
]);

export type LeercoachPortfolioVersionCreatedBy = z.infer<
  typeof portfolioVersionCreatedBySchema
>;

// Canonical scope hash — compares two scope objects for equality
// regardless of array ordering in the "kerntaken" variant. Used by
// resolveOrCreate to find an existing row for a given scope without
// needing a DB-level jsonb-compare index (scope is stored as jsonb
// but we do the match in application code for portability).
function canonicalScopeKey(scope: LeercoachPortfolioScope): string {
  switch (scope.type) {
    case "full_profiel":
      return "full_profiel";
    case "kerntaak":
      return `kerntaak:${scope.kerntaakCode}`;
    case "kerntaken": {
      const sorted = [...scope.kerntaakCodes].sort();
      return `kerntaken:${sorted.join(",")}`;
    }
  }
}

// Invariant enforced in both create paths (create + resolveOrCreate):
//
//   - profiel.richting === "instructeur" → instructieGroepId MUST be set
//   - profiel.richting !== "instructeur" → instructieGroepId MUST be null
//
// Reason: the NWD domain only models instructiegroepen for richting
// "instructeur" (leercoach and pvb_beoordelaar tables are empty), so
// rejecting the wrong combinations here prevents nonsense rows from
// ever landing. Also cross-checks the instructiegroep's own richting
// matches the profiel's — belt-and-braces since the UI picker already
// filters by richting.
//
// Inlined in each caller via the withTransaction tx, so the tx type
// stays inferred and we avoid the typing dance of a helper that needs
// to accept a Drizzle transaction shape.

// ---- Read: single portfolio, user-scoped ----

export const getPortfolioByIdInput = z.object({
  portfolioId: uuidSchema,
  userId: uuidSchema,
});

export const getPortfolioByIdOutput = z
  .object({
    portfolioId: uuidSchema,
    userId: uuidSchema,
    profielId: uuidSchema,
    scope: leercoachPortfolioScopeSchema,
    /**
     * Non-null for richting=instructeur portfolios, null otherwise.
     * Invariant enforced at create time; see
     * assertInstructieGroepMatchesRichting comment block above.
     */
    instructieGroepId: uuidSchema.nullable(),
    title: z.string(),
    currentVersionId: uuidSchema.nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .nullable();

/**
 * Fetch a portfolio by id, scoped to the requesting user. Returns
 * null when the portfolio doesn't exist OR belongs to a different
 * user — never throws on mismatch so callers can't probe for
 * existence across users.
 */
export const getById = wrapQuery(
  "leercoach.portfolio.getById",
  withZod(getPortfolioByIdInput, getPortfolioByIdOutput, async (input) => {
    const query = useQuery();
    const row = await query
      .select({
        id: s.leercoachPortfolio.id,
        userId: s.leercoachPortfolio.userId,
        profielId: s.leercoachPortfolio.profielId,
        scope: s.leercoachPortfolio.scope,
        instructieGroepId: s.leercoachPortfolio.instructieGroepId,
        title: s.leercoachPortfolio.title,
        currentVersionId: s.leercoachPortfolio.currentVersionId,
        createdAt: s.leercoachPortfolio.createdAt,
        updatedAt: s.leercoachPortfolio.updatedAt,
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

    if (!row) return null;
    return {
      portfolioId: row.id,
      userId: row.userId,
      profielId: row.profielId,
      scope: row.scope,
      instructieGroepId: row.instructieGroepId,
      title: row.title,
      currentVersionId: row.currentVersionId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }),
);

// ---- List: portfolios for a user ----
//
// Powers the leercoach index page's "Jouw portfolio-concepten" section.
// Joins a count of non-deleted chats per portfolio so the card can show
// "3 sessies" without an N+1 query on the page. Ordering by
// updatedAt DESC means active drafts float to the top.

export const listPortfoliosByUserIdInput = z.object({
  userId: uuidSchema,
  limit: z.number().int().min(1).max(100).default(50),
});

export const listPortfoliosByUserIdOutput = z.array(
  z.object({
    portfolioId: uuidSchema,
    profielId: uuidSchema,
    scope: leercoachPortfolioScopeSchema,
    /** Id of the attached instructiegroep (if richting=instructeur). */
    instructieGroepId: uuidSchema.nullable(),
    /**
     * Title of the attached instructiegroep, joined at query time so
     * the UI can render "Instructeur 5 — Jeugdzeilen" without a second
     * round-trip. Null for non-instructeur portfolios.
     */
    instructieGroepTitle: z.string().nullable(),
    title: z.string(),
    currentVersionId: uuidSchema.nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    /** Non-deleted chats currently attached to this portfolio. */
    chatCount: z.number().int().min(0),
  }),
);

export const listByUserId = wrapQuery(
  "leercoach.portfolio.listByUserId",
  withZod(
    listPortfoliosByUserIdInput,
    listPortfoliosByUserIdOutput,
    async (input) => {
      const query = useQuery();
      const rows = await query
        .select({
          id: s.leercoachPortfolio.id,
          profielId: s.leercoachPortfolio.profielId,
          scope: s.leercoachPortfolio.scope,
          instructieGroepId: s.leercoachPortfolio.instructieGroepId,
          instructieGroepTitle: s.instructieGroep.title,
          title: s.leercoachPortfolio.title,
          currentVersionId: s.leercoachPortfolio.currentVersionId,
          createdAt: s.leercoachPortfolio.createdAt,
          updatedAt: s.leercoachPortfolio.updatedAt,
          chatCount: sql<number>`(
            SELECT COUNT(*)::int
            FROM ${s.leercoachChat}
            WHERE ${s.leercoachChat.portfolioId} = ${s.leercoachPortfolio.id}
              AND ${s.leercoachChat.deletedAt} IS NULL
          )`,
        })
        .from(s.leercoachPortfolio)
        // LEFT JOIN: instructieGroepId is nullable (leercoach /
        // pvb_beoordelaar portfolios have none) — those rows still
        // need to be returned with a null title instead of being
        // dropped by an INNER JOIN.
        .leftJoin(
          s.instructieGroep,
          eq(s.instructieGroep.id, s.leercoachPortfolio.instructieGroepId),
        )
        .where(
          and(
            eq(s.leercoachPortfolio.userId, input.userId),
            isNull(s.leercoachPortfolio.deletedAt),
          ),
        )
        .orderBy(desc(s.leercoachPortfolio.updatedAt))
        .limit(input.limit);

      return rows.map((r) => ({
        portfolioId: r.id,
        profielId: r.profielId,
        scope: r.scope,
        instructieGroepId: r.instructieGroepId,
        instructieGroepTitle: r.instructieGroepTitle,
        title: r.title,
        currentVersionId: r.currentVersionId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        chatCount: r.chatCount,
      }));
    },
  ),
);

// ---- Create (no find) ----

export const createPortfolioInput = z.object({
  userId: uuidSchema,
  profielId: uuidSchema,
  scope: leercoachPortfolioScopeSchema,
  /**
   * Required when the profiel is richting=instructeur; must be null
   * otherwise. Runtime validation lives in the body — Zod can't
   * express "required iff profiel.richting is X" without a DB call.
   */
  instructieGroepId: uuidSchema.nullable(),
  title: z.string().default(""),
});

export const createPortfolioOutput = z.object({
  portfolioId: uuidSchema,
});

export const create = wrapCommand(
  "leercoach.portfolio.create",
  withZod(createPortfolioInput, createPortfolioOutput, async (input) => {
    return withTransaction(async (tx) => {
      // Richting ↔ instructiegroep invariant check — see the comment
      // block above on assertInstructieGroepMatchesRichting.
      const profiel = await tx
        .select({ richting: s.kwalificatieprofiel.richting })
        .from(s.kwalificatieprofiel)
        .where(eq(s.kwalificatieprofiel.id, input.profielId))
        .limit(1)
        .then((r) => r[0]);
      if (!profiel) {
        throw new Error("Kwalificatieprofiel niet gevonden.");
      }
      const needsInstructieGroep = profiel.richting === "instructeur";
      if (needsInstructieGroep && !input.instructieGroepId) {
        throw new Error(
          "Voor een instructeur-portfolio moet een instructiegroep gekozen worden.",
        );
      }
      if (!needsInstructieGroep && input.instructieGroepId) {
        throw new Error(
          "Alleen instructeur-portfolios gebruiken instructiegroepen; laat dit veld leeg voor leercoach en PvB-beoordelaar.",
        );
      }
      if (input.instructieGroepId) {
        const ig = await tx
          .select({ richting: s.instructieGroep.richting })
          .from(s.instructieGroep)
          .where(eq(s.instructieGroep.id, input.instructieGroepId))
          .limit(1)
          .then((r) => r[0]);
        if (!ig) {
          throw new Error("Instructiegroep niet gevonden.");
        }
        if (ig.richting !== profiel.richting) {
          throw new Error(
            `Instructiegroep-richting (${ig.richting}) komt niet overeen met profiel-richting (${profiel.richting}).`,
          );
        }
      }

      const inserted = await tx
        .insert(s.leercoachPortfolio)
        .values({
          userId: input.userId,
          profielId: input.profielId,
          scope: input.scope,
          instructieGroepId: input.instructieGroepId,
          title: input.title,
        })
        .returning({ id: s.leercoachPortfolio.id })
        .then((r) => r[0]);
      if (!inserted) {
        throw new Error("Insert leercoach.portfolio returned no rows");
      }
      return { portfolioId: inserted.id };
    });
  }),
);

// ---- Find-or-create by (user, profiel, scope) ----
//
// Called by the chat-creation flow to attach a new chat to the
// kandidaat's existing portfolio for this scope, or create a fresh
// one if they haven't started yet. Matching is done in-memory
// against canonicalScopeKey because jsonb-equality indexes are
// finicky across Postgres versions — the (user, profiel) btree
// keeps the candidate set tiny (users rarely have more than a
// handful of portfolios per profiel).

export const resolveOrCreatePortfolioInput = z.object({
  userId: uuidSchema,
  profielId: uuidSchema,
  scope: leercoachPortfolioScopeSchema,
  /**
   * Required when the profiel is richting=instructeur; must be null
   * otherwise. Part of the identity tuple so "Instructeur-5 Jeugdzeilen"
   * and "Instructeur-5 Jachtvaren" resolve to DIFFERENT portfolios.
   */
  instructieGroepId: uuidSchema.nullable(),
  /** Title to use when creating; ignored when an existing match is found. */
  titleWhenCreating: z.string().default(""),
});

export const resolveOrCreatePortfolioOutput = z.object({
  portfolioId: uuidSchema,
  created: z.boolean(),
});

export const resolveOrCreate = wrapCommand(
  "leercoach.portfolio.resolveOrCreate",
  withZod(
    resolveOrCreatePortfolioInput,
    resolveOrCreatePortfolioOutput,
    async (input) => {
      const key = canonicalScopeKey(input.scope);
      return withTransaction(async (tx) => {
        // Same richting-instructiegroep invariant as `create`. Repeating
        // inline rather than extracting because the tx type is hard to
        // carry through a helper without typing gymnastics; the checks
        // are ~20 lines, duplicated twice.
        const profiel = await tx
          .select({ richting: s.kwalificatieprofiel.richting })
          .from(s.kwalificatieprofiel)
          .where(eq(s.kwalificatieprofiel.id, input.profielId))
          .limit(1)
          .then((r) => r[0]);
        if (!profiel) {
          throw new Error("Kwalificatieprofiel niet gevonden.");
        }
        const needsInstructieGroep = profiel.richting === "instructeur";
        if (needsInstructieGroep && !input.instructieGroepId) {
          throw new Error(
            "Voor een instructeur-portfolio moet een instructiegroep gekozen worden.",
          );
        }
        if (!needsInstructieGroep && input.instructieGroepId) {
          throw new Error(
            "Alleen instructeur-portfolios gebruiken instructiegroepen; laat dit veld leeg voor leercoach en PvB-beoordelaar.",
          );
        }
        if (input.instructieGroepId) {
          const ig = await tx
            .select({ richting: s.instructieGroep.richting })
            .from(s.instructieGroep)
            .where(eq(s.instructieGroep.id, input.instructieGroepId))
            .limit(1)
            .then((r) => r[0]);
          if (!ig) {
            throw new Error("Instructiegroep niet gevonden.");
          }
          if (ig.richting !== profiel.richting) {
            throw new Error(
              `Instructiegroep-richting (${ig.richting}) komt niet overeen met profiel-richting (${profiel.richting}).`,
            );
          }
        }

        // Narrow candidate set by (user, profiel, instructiegroep).
        // Instructiegroep needs special handling for the null case —
        // `eq(x, null)` always returns false in SQL, use `isNull` instead.
        const candidates = await tx
          .select({
            id: s.leercoachPortfolio.id,
            scope: s.leercoachPortfolio.scope,
          })
          .from(s.leercoachPortfolio)
          .where(
            and(
              eq(s.leercoachPortfolio.userId, input.userId),
              eq(s.leercoachPortfolio.profielId, input.profielId),
              input.instructieGroepId
                ? eq(
                    s.leercoachPortfolio.instructieGroepId,
                    input.instructieGroepId,
                  )
                : isNull(s.leercoachPortfolio.instructieGroepId),
              isNull(s.leercoachPortfolio.deletedAt),
            ),
          );
        for (const c of candidates) {
          if (canonicalScopeKey(c.scope) === key) {
            return { portfolioId: c.id, created: false };
          }
        }
        const inserted = await tx
          .insert(s.leercoachPortfolio)
          .values({
            userId: input.userId,
            profielId: input.profielId,
            scope: input.scope,
            instructieGroepId: input.instructieGroepId,
            title: input.titleWhenCreating,
          })
          .returning({ id: s.leercoachPortfolio.id })
          .then((r) => r[0]);
        if (!inserted) {
          throw new Error("Insert leercoach.portfolio returned no rows");
        }
        return { portfolioId: inserted.id, created: true };
      });
    },
  ),
);

// ---- Update: rename ----

export const updatePortfolioTitleInput = z.object({
  portfolioId: uuidSchema,
  userId: uuidSchema,
  title: z.string().min(1).max(200),
});

export const updateTitle = wrapCommand(
  "leercoach.portfolio.updateTitle",
  withZod(updatePortfolioTitleInput, z.void(), async (input) => {
    return withTransaction(async (tx) => {
      await tx
        .update(s.leercoachPortfolio)
        .set({
          title: input.title,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(s.leercoachPortfolio.id, input.portfolioId),
            eq(s.leercoachPortfolio.userId, input.userId),
          ),
        );
    });
  }),
);

// ---- Save a version ----
//
// Content-hash dedup: auto-save may fire repeatedly with identical
// content (user typing then pausing then typing again with the
// same delta rolled back). Skip the insert when the hash matches
// the current version.
//
// Parent-pointer bookkeeping: new version's parent = the portfolio's
// current_version_id at write time. Revert paths use this to trace
// lineage.
//
// After a successful insert, we bump current_version_id on the
// parent portfolio + touch updated_at. All three writes are in one
// transaction so current_version_id never points at a non-existent
// row.

export const saveVersionInput = z.object({
  portfolioId: uuidSchema,
  userId: uuidSchema,
  content: z.string().min(1),
  createdBy: portfolioVersionCreatedBySchema,
  createdByMessageId: uuidSchema.optional(),
  label: z.string().max(200).optional(),
  changeNote: z.string().max(500).optional(),
});

export const saveVersionOutput = z.object({
  versionId: uuidSchema,
  created: z.boolean(),
});

export const saveVersion = wrapCommand(
  "leercoach.portfolio.saveVersion",
  withZod(saveVersionInput, saveVersionOutput, async (input) => {
    const contentHash = createHash("sha256")
      .update(input.content, "utf8")
      .digest("hex");

    return withTransaction(async (tx) => {
      // Ownership check inside the transaction so a racing delete
      // doesn't let us write versions for a portfolio we no longer own.
      const portfolio = await tx
        .select({
          id: s.leercoachPortfolio.id,
          currentVersionId: s.leercoachPortfolio.currentVersionId,
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

      // Dedup against the portfolio's current version. We don't dedup
      // against ALL versions — a user who reverts then re-saves an
      // older snapshot legitimately creates "the same content" as a
      // historical version, and that shouldn't be squashed.
      if (portfolio.currentVersionId) {
        const current = await tx
          .select({ contentHash: s.leercoachPortfolioVersion.contentHash })
          .from(s.leercoachPortfolioVersion)
          .where(eq(s.leercoachPortfolioVersion.id, portfolio.currentVersionId))
          .limit(1)
          .then((r) => r[0]);
        if (current && current.contentHash === contentHash) {
          return {
            versionId: portfolio.currentVersionId,
            created: false,
          };
        }
      }

      const inserted = await tx
        .insert(s.leercoachPortfolioVersion)
        .values({
          portfolioId: input.portfolioId,
          content: input.content,
          contentHash,
          createdBy: input.createdBy,
          createdByMessageId: input.createdByMessageId,
          label: input.label,
          parentVersionId: portfolio.currentVersionId,
          changeNote: input.changeNote,
        })
        .returning({ id: s.leercoachPortfolioVersion.id })
        .then((r) => r[0]);
      if (!inserted) {
        throw new Error("Insert leercoach.portfolio_version returned no rows");
      }

      await tx
        .update(s.leercoachPortfolio)
        .set({
          currentVersionId: inserted.id,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(s.leercoachPortfolio.id, input.portfolioId));

      return { versionId: inserted.id, created: true };
    });
  }),
);

// ---- Read: version ----

export const getVersionByIdInput = z.object({
  versionId: uuidSchema,
  userId: uuidSchema,
});

export const getVersionByIdOutput = z
  .object({
    versionId: uuidSchema,
    portfolioId: uuidSchema,
    content: z.string(),
    contentHash: z.string(),
    createdBy: portfolioVersionCreatedBySchema,
    createdByMessageId: uuidSchema.nullable(),
    label: z.string().nullable(),
    parentVersionId: uuidSchema.nullable(),
    changeNote: z.string().nullable(),
    createdAt: z.string(),
  })
  .nullable();

export const getVersionById = wrapQuery(
  "leercoach.portfolio.getVersionById",
  withZod(getVersionByIdInput, getVersionByIdOutput, async (input) => {
    const query = useQuery();
    const row = await query
      .select({
        v: s.leercoachPortfolioVersion,
      })
      .from(s.leercoachPortfolioVersion)
      .innerJoin(
        s.leercoachPortfolio,
        eq(s.leercoachPortfolio.id, s.leercoachPortfolioVersion.portfolioId),
      )
      .where(
        and(
          eq(s.leercoachPortfolioVersion.id, input.versionId),
          eq(s.leercoachPortfolio.userId, input.userId),
          isNull(s.leercoachPortfolioVersion.deletedAt),
          isNull(s.leercoachPortfolio.deletedAt),
        ),
      )
      .limit(1)
      .then((r) => r[0]);
    if (!row) return null;
    return {
      versionId: row.v.id,
      portfolioId: row.v.portfolioId,
      content: row.v.content,
      contentHash: row.v.contentHash,
      createdBy: row.v.createdBy,
      createdByMessageId: row.v.createdByMessageId,
      label: row.v.label,
      parentVersionId: row.v.parentVersionId,
      changeNote: row.v.changeNote,
      createdAt: row.v.createdAt,
    };
  }),
);

// ---- List: versions for a portfolio ----

export const listVersionsInput = z.object({
  portfolioId: uuidSchema,
  userId: uuidSchema,
  limit: z.number().int().min(1).max(100).default(50),
});

export const listVersionsOutput = z.array(
  z.object({
    versionId: uuidSchema,
    createdBy: portfolioVersionCreatedBySchema,
    label: z.string().nullable(),
    changeNote: z.string().nullable(),
    parentVersionId: uuidSchema.nullable(),
    createdAt: z.string(),
    /** Character count of `content`, for UI labels without loading the full text. */
    contentLength: z.number().int().min(0),
  }),
);

/**
 * List versions for a portfolio, newest first, without loading the
 * full content (we return char length only — the history sidebar
 * doesn't need the full text until the user clicks a row).
 */
export const listVersions = wrapQuery(
  "leercoach.portfolio.listVersions",
  withZod(listVersionsInput, listVersionsOutput, async (input) => {
    const query = useQuery();
    const rows = await query
      .select({
        versionId: s.leercoachPortfolioVersion.id,
        createdBy: s.leercoachPortfolioVersion.createdBy,
        label: s.leercoachPortfolioVersion.label,
        changeNote: s.leercoachPortfolioVersion.changeNote,
        parentVersionId: s.leercoachPortfolioVersion.parentVersionId,
        createdAt: s.leercoachPortfolioVersion.createdAt,
        content: s.leercoachPortfolioVersion.content,
      })
      .from(s.leercoachPortfolioVersion)
      .innerJoin(
        s.leercoachPortfolio,
        eq(s.leercoachPortfolio.id, s.leercoachPortfolioVersion.portfolioId),
      )
      .where(
        and(
          eq(s.leercoachPortfolioVersion.portfolioId, input.portfolioId),
          eq(s.leercoachPortfolio.userId, input.userId),
          isNull(s.leercoachPortfolioVersion.deletedAt),
          isNull(s.leercoachPortfolio.deletedAt),
        ),
      )
      .orderBy(desc(s.leercoachPortfolioVersion.createdAt))
      .limit(input.limit);
    return rows.map((r) => ({
      versionId: r.versionId,
      createdBy: r.createdBy,
      label: r.label,
      changeNote: r.changeNote,
      parentVersionId: r.parentVersionId,
      createdAt: r.createdAt,
      contentLength: r.content.length,
    }));
  }),
);

// ---- Update version label (user-driven) ----

export const labelVersionInput = z.object({
  versionId: uuidSchema,
  userId: uuidSchema,
  label: z.string().max(200).nullable(),
});

export const labelVersion = wrapCommand(
  "leercoach.portfolio.labelVersion",
  withZod(labelVersionInput, z.void(), async (input) => {
    return withTransaction(async (tx) => {
      // Ownership check via the join — userId lives on the portfolio
      // row, not the version, so we subquery to verify.
      const v = await tx
        .select({ v: s.leercoachPortfolioVersion.id })
        .from(s.leercoachPortfolioVersion)
        .innerJoin(
          s.leercoachPortfolio,
          eq(s.leercoachPortfolio.id, s.leercoachPortfolioVersion.portfolioId),
        )
        .where(
          and(
            eq(s.leercoachPortfolioVersion.id, input.versionId),
            eq(s.leercoachPortfolio.userId, input.userId),
          ),
        )
        .limit(1)
        .then((r) => r[0]);
      if (!v) return;
      await tx
        .update(s.leercoachPortfolioVersion)
        .set({ label: input.label })
        .where(eq(s.leercoachPortfolioVersion.id, input.versionId));
    });
  }),
);

// ---- Attach chat to portfolio ----
//
// Called from chat-creation to wire chat.portfolio_id at the moment
// we know (or have created) the portfolio. Kept as a tiny command
// rather than a direct column update in the chat model so the two
// sides of the relationship can evolve independently.

export const attachChatToPortfolioInput = z.object({
  chatId: uuidSchema,
  portfolioId: uuidSchema,
});

export const attachChat = wrapCommand(
  "leercoach.portfolio.attachChat",
  withZod(attachChatToPortfolioInput, z.void(), async (input) => {
    return withTransaction(async (tx) => {
      await tx
        .update(s.leercoachChat)
        .set({ portfolioId: input.portfolioId })
        .where(eq(s.leercoachChat.id, input.chatId));
    });
  }),
);
