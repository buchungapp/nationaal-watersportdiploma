import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const mainCategories = pgTable("main_category", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
});
