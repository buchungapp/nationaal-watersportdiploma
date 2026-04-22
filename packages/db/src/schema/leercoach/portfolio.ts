import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { instructieGroep } from "../kss/instructiegroep.js";
import { leercoachSchema } from "./schema.js";

// Source of each version row — lets the UI badge coach vs user edits
// and drives analytics ("how many kandidaten take over writing vs stay
// in the coach-driven flow?"). Also gates certain revert paths: a user
// can revert to any version, but the coach only reads the latest one.
export const portfolioVersionCreatedBy = leercoachSchema.enum(
  "portfolio_version_created_by",
  ["coach", "user", "imported"],
);

// Scope copies from leercoach.chat — same discriminated union. A
// portfolio is pinned to one (profiel, scope) combo; switching scope
// mid-work creates a new portfolio rather than mutating this one.
export type LeercoachPortfolioScope =
  | { type: "full_profiel" }
  | { type: "kerntaak"; kerntaakCode: string }
  | { type: "kerntaken"; kerntaakCodes: string[] };

// ---- portfolio ----
//
// The canonical document a kandidaat is working on. Identity tuple:
// (user, profiel, scope, instructieGroepId). Multiple chats can
// reference the same portfolio, so a user who hits the context limit
// and starts a new chat doesn't lose their draft continuity.
//
// `instructie_groep_id` is NULLABLE at the DB level but required at
// the APP level for `richting=instructeur` profielen. The NWD domain
// only models instructiegroepen for instructeur — leercoach and
// pvb_beoordelaar portfolios always carry NULL here. The app-layer
// guard lives in Portfolio.create / Portfolio.resolveOrCreate and
// rejects mismatched combinations (instructeur without instructiegroep,
// or non-instructeur with one).
//
// `current_version_id` is a denormalized pointer for O(1) reads —
// avoids `SELECT * FROM version WHERE portfolio_id = ? ORDER BY
// created_at DESC LIMIT 1` on every page load. Updated inside the
// saveVersion transaction so it never points at a stale or
// unreachable row.

export const leercoachPortfolio = leercoachSchema.table(
  "portfolio",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    // Supabase auth.users.id — no FK, same convention as leercoachChat.
    userId: uuid("user_id").notNull(),
    // KSS kwalificatieprofiel id. No FK here either to keep the
    // leercoach schema self-contained; validated in core models.
    profielId: uuid("profiel_id").notNull(),
    // Same discriminated-union jsonb as chat.scope.
    scope: jsonb("scope").$type<LeercoachPortfolioScope>().notNull(),
    // Which NWD instructiegroep this portfolio is written for
    // (Jachtvaren, Jeugdzeilen, etc.). Only relevant for
    // richting=instructeur profielen — leercoach and pvb_beoordelaar
    // always store NULL here. RESTRICT on delete: an instructiegroep
    // with active portfolios shouldn't vanish without explicit
    // migration.
    instructieGroepId: uuid("instructie_groep_id"),
    // Human-readable title; mirrors chat title at creation time but
    // can diverge (user renames, etc.).
    title: text("title").notNull().default(""),
    // Denormalized pointer to the most recent non-deleted version.
    // Nullable because a freshly-created portfolio has no versions
    // yet (the coach or user creates v1 on first save).
    currentVersionId: uuid("current_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.instructieGroepId],
      foreignColumns: [instructieGroep.id],
    }).onDelete("restrict"),
    // Primary read path: look up all portfolios for a user, newest
    // first, for any future "my portfolios" index page.
    index("portfolio_user_created_idx").on(
      table.userId,
      table.createdAt.desc(),
    ),
    // Find-or-create path: given (user, profiel, scope, instructiegroep),
    // does a portfolio already exist? scope is jsonb so we can't build
    // a plain btree index on the exact shape — we hash it in the core
    // model's resolver and rely on the (user, profiel, instructiegroep)
    // portion of the index to narrow the candidate set.
    index("portfolio_user_profiel_groep_idx").on(
      table.userId,
      table.profielId,
      table.instructieGroepId,
    ),
  ],
);

// ---- portfolio_version ----
//
// Immutable snapshot of the portfolio at a point in time. New edits
// ALWAYS create a new row; existing rows are never mutated. This
// keeps history honest (a coach that overwrites user work without
// evidence would be a real problem) and makes "revert" trivial
// (insert a new version whose content is an older version's content).
//
// `content_hash` dedup: the editor auto-saves on idle, and the
// coach may save effectively-identical drafts on retry. On save,
// the core model checks hash against the current version and skips
// the insert if they match — avoids polluting history with no-op
// rows.

export const leercoachPortfolioVersion = leercoachSchema.table(
  "portfolio_version",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    portfolioId: uuid("portfolio_id").notNull(),
    // Full markdown text of this version. Sized with `text` (unlimited)
    // because portfolios commonly run 10–30k chars; stored verbatim
    // to avoid any lossy round-trip when the editor re-opens them.
    content: text("content").notNull(),
    // sha256 of content, hex-encoded. Used by the save path to skip
    // no-op writes. Stored so we don't recompute on every read.
    contentHash: text("content_hash").notNull(),
    createdBy: portfolioVersionCreatedBy("created_by").notNull(),
    // Link back to the chat message that produced this version. Only
    // set when created_by='coach' (via the saveDraft tool call).
    // Nullable for user edits + imported legacy versions.
    createdByMessageId: uuid("created_by_message_id"),
    // User-assignable label ("ingediend bij beoordelaar", "na
    // feedback coach Bob", …). Not used by the coach; purely UX.
    label: text("label"),
    // Parent version in the linear history chain. Null for v1.
    // Never null thereafter since every new version is built on
    // top of something.
    parentVersionId: uuid("parent_version_id"),
    // Short user-or-coach-supplied note describing what changed in
    // this version. Coach fills it from the `changeNote` arg of
    // saveDraft; user can optionally fill when labeling.
    changeNote: text("change_note"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.portfolioId],
      foreignColumns: [leercoachPortfolio.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.parentVersionId],
      foreignColumns: [table.id],
    }).onDelete("set null"),
    // Primary read path: all versions of a portfolio, newest first.
    // Covers the history sidebar + the "find latest" shortcut.
    index("portfolio_version_portfolio_created_idx").on(
      table.portfolioId,
      table.createdAt.desc(),
    ),
    // Idempotency guard: the save path checks
    // (portfolioId, contentHash) before inserting to dedup
    // effectively-identical saves. The unique index is a belt-and-
    // braces enforcement so racing saves can't produce duplicates
    // even if the app-level check missed them.
    uniqueIndex("portfolio_version_portfolio_hash_unique").on(
      table.portfolioId,
      table.contentHash,
    ),
  ],
);
