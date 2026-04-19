import { sql } from "drizzle-orm";
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
  },
  (table) => [
    foreignKey({
      columns: [table.chatId],
      foreignColumns: [leercoachChat.id],
    }).onDelete("cascade"),
    // Primary read path: all messages in a chat, oldest first.
    index("message_chat_created_idx").on(table.chatId, table.createdAt.asc()),
  ],
);
