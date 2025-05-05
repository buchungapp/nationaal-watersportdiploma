import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../utils/sql.js";
import { user } from "./user.js";

export const token = pgTable(
  "token",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    name: text("name").notNull(),
    hashedKey: text("hashed_key").notNull(),
    partialKey: text("partial_key").notNull(),
    expires: timestamp("expires", {
      withTimezone: true,
      mode: "string",
    }),
    userId: uuid("user_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex().on(table.hashedKey),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.authUserId],
      name: "token_user_id_fk",
    }),
  ],
);

export const tokenUsage = pgTable(
  "token_usage",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    tokenId: uuid("token_id").notNull(),
    usedAt: timestamp("used_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.tokenId],
      foreignColumns: [token.id],
      name: "token_usage_token_id_fk",
    }),
    // Index on token_id and used_at for fast lookups
    index().on(table.tokenId, table.usedAt.desc()),
  ],
);
