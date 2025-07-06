import { sql } from "drizzle-orm";
import { foreignKey, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { course } from "../index.js";
import { kssSchema } from "./schema.js";
import { richting } from "./toetsdocument.js";

export const instructieGroep = kssSchema.table(
  "instructie_groep",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    title: text("title").notNull(),
    richting: richting("richting").notNull(),
  },
  (table) => [],
);

export const instructieGroepCursus = kssSchema.table(
  "instructie_groep_cursus",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    instructieGroepId: uuid("instructie_groep_id").notNull(),
    courseId: uuid("course_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.instructieGroepId],
      foreignColumns: [instructieGroep.id],
    }),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
    }),
    uniqueIndex().on(table.instructieGroepId, table.courseId),
  ],
);
