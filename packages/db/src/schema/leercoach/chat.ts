import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  jsonb,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { instructieGroep } from "../kss/instructiegroep.js";
import { kwalificatieprofiel } from "../kss/toetsdocument.js";
import { leercoachSchema } from "./schema.js";

// Phases of a leercoach chat — explicit workflow the model + user
// negotiate. Order is meaningful (users advance / retreat through it)
// but the DB doesn't enforce the order; the model's system prompt +
// UI stepper are the arbiters.
//
//   verkennen  — open questions, elicit concrete STAR stories
//   ordenen    — group material by werkproces/criterium, find gaps
//   concept    — produce draft bewijs-paragrafen in the kandidaat's
//                voice (model uses searchPriorPortfolio for style)
//   verfijnen  — line-by-line editing; push back on vague language
export const leercoachChatPhase = leercoachSchema.enum("chat_phase", [
  "verkennen",
  "ordenen",
  "concept",
  "verfijnen",
]);

// A conversation between a kandidaat and the digital leercoach.
//
// Two shapes of chat coexist:
//
//   Vraag-sessie (Q&A): profielId + scope + portfolioId are all NULL.
//     The assistant acts as a general NWD leercoach — KSS questions,
//     curriculum lookups, knowledge-base search — with no specific
//     portfolio draft in context. Title is derived from the first user
//     turn.
//
//   Portfolio-sessie: profielId + scope + portfolioId are all SET.
//     The assistant is coaching the user through writing a specific
//     portfolio draft for a specific kwalificatieprofiel and scope.
//     Title mirrors the portfolio's title.
//
// A Q&A chat can be promoted to a portfolio chat via the promote flow
// (server action that resolves-or-creates a portfolio + updates this
// row). Promotion is one-way — downgrade to Q&A means starting a new
// chat.
//
// When present, scope is a discriminated union:
//   { type: "full_profiel" }
//     — N3 always uses this; N4/N5 users working through their whole profiel
//   { type: "kerntaak", kerntaakCode: "4.1" }
//     — N4/N5 users working on one kerntaak at a time
//   { type: "kerntaken", kerntaakCodes: ["5.3", "5.5", "5.7"] }
//     — bundle of kerntaken from the same profiel, mirroring the filename
//       patterns in our anonymised portfolio corpus
export type LeercoachChatScope =
  | { type: "full_profiel" }
  | { type: "kerntaak"; kerntaakCode: string }
  | { type: "kerntaken"; kerntaakCodes: string[] };

export const leercoachChat = leercoachSchema.table(
  "chat",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    // Supabase auth.users.id. No FK — auth.users lives in a different schema
    // we don't own. Validated in the application layer.
    userId: uuid("user_id").notNull(),
    // Nullable: Q&A chats have no profiel context. Filled in at
    // creation time for portfolio chats, or by the promote flow when
    // a Q&A chat gets bound to a portfolio.
    profielId: uuid("profiel_id"),
    // Nullable alongside profielId — scope only exists when there's a
    // profiel to scope. When set, must match the attached portfolio's
    // scope (enforced in the core layer at mutation time, not by the
    // DB — no cheap SQL constraint for discriminated-union equality).
    scope: jsonb("scope").$type<LeercoachChatScope>(),
    // Inherited from the attached portfolio for portfolio-sessies;
    // always null for Q&A-sessies. Tracks which instructiegroep the
    // coach is framing evidence-gathering around (zwaardboot / jeugd
    // sailing / etc.) — only populated for richting=instructeur chats,
    // same contract as portfolio.instructie_groep_id.
    instructieGroepId: uuid("instructie_groep_id"),
    // Workflow phase. Defaults to verkennen at creation. Transitions
    // via the model's setPhase tool or a user's stepper click (which
    // posts a scripted user message and lets the model confirm).
    phase: leercoachChatPhase("phase").notNull().default("verkennen"),
    // Resumable-stream bookkeeping. `activeStreamId` is the stream id
    // currently being published into Redis by the POST route — the
    // GET /stream reconnect endpoint checks this to decide whether
    // there's anything to resume. Nulled at onFinish and on cancel.
    //
    // `canceledAt` is the user-driven stop signal: the DELETE /stream
    // handler sets it, and the in-flight streamText call polls the
    // row (throttled to once per second) to abort itself server-side.
    // Cleared at the start of the next POST so a stale cancel doesn't
    // kill the next turn.
    activeStreamId: text("active_stream_id"),
    canceledAt: timestamp("canceled_at", {
      withTimezone: true,
      mode: "string",
    }),
    // Links this chat to the portfolio document it's producing drafts
    // for. Resolved at chat-creation time via find-or-create on
    // (user_id, profiel_id, scope) in leercoach.portfolio. Nullable
    // because legacy chats predate the portfolio model — the one-time
    // import script backfills them.
    portfolioId: uuid("portfolio_id"),
    title: text("title").notNull().default(""),
    visibility: varchar("visibility", {
      length: 16,
      enum: ["private", "public"],
    })
      .notNull()
      .default("private"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    // SET NULL (not cascade): kwalificatieprofielen are reference data
    // that in practice never get deleted, but on the off-chance one is
    // removed we'd rather null the FK and let the chat survive as
    // unscoped history than erase the user's conversation. Matches the
    // nullable profielId column above.
    foreignKey({
      columns: [table.profielId],
      foreignColumns: [kwalificatieprofiel.id],
    }).onDelete("set null"),
    // Same SET NULL pairing for instructiegroep. Reference data, rarely
    // deleted; when it does happen we'd rather preserve chat history.
    foreignKey({
      columns: [table.instructieGroepId],
      foreignColumns: [instructieGroep.id],
    }).onDelete("set null"),
    // Primary read path: list a user's chats, newest first.
    index("chat_user_created_idx").on(table.userId, table.createdAt.desc()),
    index("chat_profiel_idx").on(table.profielId),
  ],
);
