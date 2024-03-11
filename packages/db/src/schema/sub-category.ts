import {
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { mainCategories } from "./main-category.js";

export const subCategories = pgTable(
  "sub_category",
  {
    mainCategoryId: integer("main_category_id").notNull(),
    id: serial("id"),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.mainCategoryId, table.id],
    }),
    // TODO should be on delete cascade
    mainCategories: foreignKey({
      columns: [table.mainCategoryId],
      foreignColumns: [mainCategories.id],
    }),
  }),
);
