import { sql } from 'drizzle-orm'
import {
  foreignKey,
  pgEnum,
  pgTable,
  smallint,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

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
  },
  (table) => {
    return {
      unqHandle: unique().on(table.handle),
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
  },

  (table) => {
    return {
      unqHandle: unique().on(table.handle),
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
  },
  (table) => {
    return {
      unqHandle: unique().on(table.handle),
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
  },
  (table) => {
    return {
      unqHandle: unique().on(table.handle),
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
  },
  (table) => {
    return {
      unqHandle: unique().on(table.handle),
      parentCategoryReference: foreignKey({
        columns: [table.parentCategoryId],
        foreignColumns: [table.id],
        name: 'category_parent_category_id_fk',
      }),
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
    disciplineId: uuid('discipline_id').notNull(),
    degreeId: uuid('degree_id').notNull(),
  },
  (table) => {
    return {
      unqHandle: unique().on(table.handle),
      disciplineReference: foreignKey({
        columns: [table.disciplineId],
        foreignColumns: [discipline.id],
        name: 'program_discipline_id_fk',
      }),
      degreeReference: foreignKey({
        columns: [table.degreeId],
        foreignColumns: [degree.id],
        name: 'program_degree_id_fk',
      }),
      unqDegreeDiscipline: unique().on(table.degreeId, table.disciplineId),
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
      unqCategoryProgram: unique().on(table.categoryId, table.programId),
    }
  },
)
