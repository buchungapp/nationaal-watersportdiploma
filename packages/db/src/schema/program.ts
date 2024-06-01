import { sql } from 'drizzle-orm'
import {
  foreignKey,
  pgEnum,
  pgTable,
  smallint,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../utils/sql.js'

export const competencyType = pgEnum('competency_type', ['knowledge', 'skill'])

export const competency = pgTable(
  'competency',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text('handle').notNull(),
    title: text('title'),
    type: competencyType('type').notNull(),
    weight: smallint('weight').notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      unqHandle: uniqueIndex().on(table.handle),
    }
  },
)

export const module = pgTable(
  'module',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text('handle').notNull(),
    title: text('title'),
    weight: smallint('weight').notNull(),
    ...timestamps,
  },

  (table) => {
    return {
      unqHandle: uniqueIndex().on(table.handle),
    }
  },
)

export const discipline = pgTable(
  'discipline',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text('handle').notNull(),
    title: text('title'),
    weight: smallint('weight').notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      unqHandle: uniqueIndex().on(table.handle),
    }
  },
)

export const degree = pgTable(
  'degree',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text('handle').notNull(),
    title: text('title'),
    rang: smallint('rang').notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      unqHandle: uniqueIndex().on(table.handle),
      unqRang: uniqueIndex().on(table.rang),
    }
  },
)

export const category = pgTable(
  'category',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    parentCategoryId: uuid('parent_category_id'),
    handle: text('handle').notNull(),
    title: text('title'),
    description: text('description'),
    weight: smallint('weight').notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      unqHandle: uniqueIndex().on(table.handle),
      parentCategoryReference: foreignKey({
        columns: [table.parentCategoryId],
        foreignColumns: [table.id],
        name: 'category_parent_category_id_fk',
      }),
    }
  },
)

export const course = pgTable(
  'course',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text('handle').notNull(),
    title: text('title'),
    description: text('description'),
    disciplineId: uuid('discipline_id').notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      unqHandle: uniqueIndex().on(table.handle),
      disciplineReference: foreignKey({
        columns: [table.disciplineId],
        foreignColumns: [discipline.id],
        name: 'course_discipline_id_fk',
      }),
    }
  },
)

export const courseCategory = pgTable(
  'course_category',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    courseId: uuid('course_id').notNull(),
    categoryId: uuid('category_id').notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      courseReference: foreignKey({
        columns: [table.courseId],
        foreignColumns: [program.id],
        name: 'course_category_program_id_fk',
      }),
      categoryReference: foreignKey({
        columns: [table.categoryId],
        foreignColumns: [category.id],
        name: 'course_category_category_id_fk',
      }),
      unqCourseCategory: uniqueIndex().on(table.categoryId, table.courseId),
    }
  },
)

export const program = pgTable(
  'program',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text('handle').notNull(),
    title: text('title'),
    disciplineId: uuid('discipline_id'),
    courseId: uuid('course_id'),
    degreeId: uuid('degree_id').notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      unqHandle: uniqueIndex().on(table.handle),
      disciplineReference: foreignKey({
        columns: [table.disciplineId],
        foreignColumns: [discipline.id],
        name: 'program_discipline_id_fk',
      }),
      courseReference: foreignKey({
        columns: [table.courseId],
        foreignColumns: [course.id],
        name: 'program_course_id_fk',
      }),
      degreeReference: foreignKey({
        columns: [table.degreeId],
        foreignColumns: [degree.id],
        name: 'program_degree_id_fk',
      }),
    }
  },
)

export const programCategory = pgTable(
  'program_category',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    programId: uuid('program_id').notNull(),
    categoryId: uuid('category_id').notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      programReference: foreignKey({
        columns: [table.programId],
        foreignColumns: [program.id],
        name: 'program_category_program_id_fk',
      }),
      categoryReference: foreignKey({
        columns: [table.categoryId],
        foreignColumns: [category.id],
        name: 'program_category_category_id_fk',
      }),
      unqCategoryProgram: uniqueIndex().on(table.categoryId, table.programId),
    }
  },
)

export const gearType = pgTable(
  'gear_type',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text('handle').notNull(),
    title: text('title'),
    ...timestamps,
  },
  (table) => {
    return {
      unqHandle: uniqueIndex().on(table.handle),
    }
  },
)
