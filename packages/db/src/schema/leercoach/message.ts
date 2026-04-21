import { isNull, sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  jsonb,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { leercoachChat } from "./chat.js";
import { leercoachSchema } from "./schema.js";

// One message in a leercoach chat. parts is an array of UIMessage parts per
// the AI SDK shape: [{ type: "text", text: "..." }, { type: "tool-call", ... }].
// Keeping it jsonb lets us add tool calls and inline artifact parts without
// a schema migration.
//
// attachments is kept separately because the SDK treats them as a distinct
// concern (file uploads get resolved to signed URLs on read, parts don't).
export type LeercoachMessagePart =
  | { type: "text"; text: string }
  | { type: string; [key: string]: unknown };

// Metadata on a compaction-summary message. Only present when the row
// IS the synthetic summary produced by POST .../compact — never on
// ordinary conversation turns.
//
// kind=="summary" — a Haiku-generated recap of older messages. The
//                   raw text lives in `parts`; this blob carries the
//                   bookkeeping the UI uses to render a divider,
//                   count what was compacted, etc.
export type LeercoachCompactionMetadata = {
  kind: "summary";
  /**
   * Number of messages folded into this summary (for the UI divider
   * "N berichten samengevat").
   */
  messageCount: number;
  /**
   * ISO timestamps of the earliest + latest compacted messages so we
   * can show a range on hover ("samengevat: 12:04 – 15:32").
   */
  fromCreatedAt: string;
  toCreatedAt: string;
  /**
   * Rough token estimate of what got compacted away, kept for
   * debugging + analytics. Not authoritative.
   */
  tokensSaved: number;
  /**
   * Message id of the "latest draft" that was preserved verbatim
   * alongside this summary (the longest-above-threshold recent
   * assistant message). Null when no message met the threshold —
   * the summary stands alone in that case.
   */
  preservedDraftMessageId: string | null;
};

export const leercoachMessage = leercoachSchema.table(
  "message",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    chatId: uuid("chat_id").notNull(),
    role: varchar("role", {
      length: 16,
      enum: ["user", "assistant", "system"],
    }).notNull(),
    parts: jsonb("parts").$type<LeercoachMessagePart[]>().notNull(),
    attachments: jsonb("attachments")
      .$type<unknown[]>()
      .default([])
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    // ---- Compaction bookkeeping ----
    //
    // When the chat gets compacted, the older messages stay in the DB
    // (so the UI can still show them, and the user can export /
    // audit) but get a pointer to the synthetic summary that replaces
    // them in the model's context window. See
    // /api/leercoach/chat/[id]/compact for the pipeline.
    //
    // - Ordinary turn: compactedIntoId = null, compactionMetadata = null
    // - A summary row: compactedIntoId = null,
    //                  compactionMetadata = { kind: "summary", ... }
    // - A folded-away turn: compactedIntoId = <summary row id>,
    //                       compactionMetadata = null
    compactedIntoId: uuid("compacted_into_id"),
    compactionMetadata: jsonb(
      "compaction_metadata",
    ).$type<LeercoachCompactionMetadata>(),
  },
  (table) => [
    foreignKey({
      columns: [table.chatId],
      foreignColumns: [leercoachChat.id],
    }).onDelete("cascade"),
    // Primary read path: all messages in a chat, oldest first.
    index("message_chat_created_idx").on(table.chatId, table.createdAt.asc()),
    // Partial index for the hot path: every chat POST turn loads the
    // chat's history and filters to rows that haven't been folded into
    // a compaction summary. A partial index over WHERE compacted_into_id
    // IS NULL keeps the index tight (compacted rows don't bloat it) and
    // lets Postgres skip the filter entirely when scanning.
    index("message_active_chat_created_idx")
      .on(table.chatId, table.createdAt.asc())
      .where(isNull(table.compactedIntoId)),
  ],
);
