import { sql } from "drizzle-orm";
import {
  foreignKey,
  pgEnum,
  pgTable,
  smallint,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../utils/sql.js";

export const competencyType = pgEnum("competency_type", ["knowledge", "skill"]);

export const competency = pgTable(
  "competency",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text("handle").notNull(),
    title: text("title"),
    type: competencyType("type").notNull(),
    weight: smallint("weight").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex().on(table.handle)],
);

export const module = pgTable(
  "module",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text("handle").notNull(),
    title: text("title"),
    weight: smallint("weight").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex().on(table.handle)],
);

export const discipline = pgTable(
  "discipline",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text("handle").notNull(),
    title: text("title"),
    weight: smallint("weight").notNull(),
    abbreviation: text("abbreviation"),
    ...timestamps,
  },
  (table) => [uniqueIndex().on(table.handle)],
);

export const degree = pgTable(
  "degree",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text("handle").notNull(),
    title: text("title"),
    rang: smallint("rang").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex().on(table.handle), uniqueIndex().on(table.rang)],
);

// type Degree = degree.$inferSelect

export const category = pgTable(
  "category",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    parentCategoryId: uuid("parent_category_id"),
    handle: text("handle").notNull(),
    title: text("title"),
    description: text("description"),
    weight: smallint("weight").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex().on(table.handle),
    foreignKey({
      columns: [table.parentCategoryId],
      foreignColumns: [table.id],
      name: "category_parent_category_id_fk",
    }),
  ],
);

export const course = pgTable(
  "course",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text("handle").notNull(),
    title: text("title"),
    description: text("description"),
    disciplineId: uuid("discipline_id").notNull(),
    abbreviation: text("abbreviation"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex().on(table.handle),
    foreignKey({
      columns: [table.disciplineId],
      foreignColumns: [discipline.id],
      name: "course_discipline_id_fk",
    }),
  ],
);

export const courseCategory = pgTable(
  "course_category",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    courseId: uuid("course_id").notNull(),
    categoryId: uuid("category_id").notNull(),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: "course_category_course_id_fk",
    }),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [category.id],
      name: "course_category_category_id_fk",
    }),
    uniqueIndex().on(table.categoryId, table.courseId),
  ],
);

export const program = pgTable(
  "program",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text("handle").notNull(),
    title: text("title"),
    courseId: uuid("course_id").notNull(),
    degreeId: uuid("degree_id").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex().on(table.handle),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: "program_course_id_fk",
    }),
    foreignKey({
      columns: [table.degreeId],
      foreignColumns: [degree.id],
      name: "program_degree_id_fk",
    }),
  ],
);

export const gearType = pgTable(
  "gear_type",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text("handle").notNull(),
    title: text("title"),
    ...timestamps,
  },
  (table) => [uniqueIndex().on(table.handle)],
);
