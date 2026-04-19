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
import { kwalificatieprofiel } from "../kss/toetsdocument.js";
import { leercoachSchema } from "./schema.js";

// A conversation between a kandidaat and the digital leercoach, scoped to one
// kwalificatieprofiel and (for N4/N5) optionally to a kerntaak or bundle of
// kerntaken.
//
// scope is a discriminated union:
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
    profielId: uuid("profiel_id").notNull(),
    scope: jsonb("scope").$type<LeercoachChatScope>().notNull(),
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
    foreignKey({
      columns: [table.profielId],
      foreignColumns: [kwalificatieprofiel.id],
    }).onDelete("cascade"),
    // Primary read path: list a user's chats, newest first.
    index("chat_user_created_idx").on(table.userId, table.createdAt.desc()),
    index("chat_profiel_idx").on(table.profielId),
  ],
);
