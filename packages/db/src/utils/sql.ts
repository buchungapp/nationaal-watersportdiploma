import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
  createdAt: timestamp("created_at", {
    mode: "string",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    mode: "string",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", {
    mode: "string",
    withTimezone: true,
  }),
};
