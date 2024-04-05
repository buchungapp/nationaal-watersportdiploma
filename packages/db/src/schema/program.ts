import { sql } from 'drizzle-orm'
import {
  boolean,
  foreignKey,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
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

export const moduleCompetency = pgTable(
  'module_competency',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    moduleId: uuid('module_id').notNull(),
    competencyId: uuid('competency_id').notNull(),
    isRequired: boolean('is_required').notNull(),
    requirement: text('requirement'),
  },
  (table) => {
    return {
      moduleReference: foreignKey({
        columns: [table.moduleId],
        foreignColumns: [module.id],
        name: 'module_competency_module_id_fk',
      }),
      competencyReference: foreignKey({
        columns: [table.competencyId],
        foreignColumns: [competency.id],
        name: 'module_competency_competency_id_fk',
      }),
      unqModuleCompetency: unique().on(table.moduleId, table.competencyId),
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

export const programRevision = pgTable(
  'program_revision',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    programId: uuid('program_id').notNull(),
    revision: text('revision').notNull(),
    validFrom: timestamp('valid_from', { withTimezone: true, mode: 'string' }),
  },
  (table) => {
    return {
      programReference: foreignKey({
        columns: [table.programId],
        foreignColumns: [program.id],
        name: 'program_revision_program_id_fk',
      }),
      unqProgramRevision: unique().on(table.programId, table.revision),
    }
  },
)
