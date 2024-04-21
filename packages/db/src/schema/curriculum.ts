import { sql } from 'drizzle-orm'
import {
  boolean,
  foreignKey,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../utils/sql.js'
import { competency, gearType, module, program } from './program.js'

export const curriculum = pgTable(
  'curriculum',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    programId: uuid('program_id').notNull(),
    revision: text('revision').notNull(),
    startedAt: timestamp('started_at', {
      withTimezone: true,
      mode: 'string',
    }),
    ...timestamps,
  },
  (table) => {
    return {
      programReference: foreignKey({
        columns: [table.programId],
        foreignColumns: [program.id],
        name: 'curriculum_program_id_fk',
      }),
      unqProgramRevision: unique().on(table.programId, table.revision),
    }
  },
)

export const curriculumModule = pgTable(
  'curriculum_module',
  {
    curriculumId: uuid('curriculum_id').notNull(),
    moduleId: uuid('module_id').notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.curriculumId, table.moduleId] }),
      curriculumReference: foreignKey({
        columns: [table.curriculumId],
        foreignColumns: [curriculum.id],
        name: 'curriculum_module_curriculum_id_fk',
      }),
      moduleReference: foreignKey({
        columns: [table.moduleId],
        foreignColumns: [module.id],
        name: 'curriculum_module_module_id_fk',
      }),
      unqCurriculumModule: unique().on(table.curriculumId, table.moduleId),
    }
  },
)

export const curriculumCompetency = pgTable(
  'curriculum_competency',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    curriculumId: uuid('curriculum_id').notNull(),
    moduleId: uuid('module_id').notNull(),
    competencyId: uuid('competency_id').notNull(),
    isRequired: boolean('is_required').notNull(),
    requirement: text('requirement'),
    ...timestamps,
  },
  (table) => {
    return {
      unq: uniqueIndex('curriculum_competency_unq_set').on(
        table.curriculumId,
        table.moduleId,
        table.competencyId,
      ),
      curriculumModuleReference: foreignKey({
        columns: [table.curriculumId, table.moduleId],
        foreignColumns: [
          curriculumModule.curriculumId,
          curriculumModule.moduleId,
        ],
        name: 'curriculum_competency_curriculum_module_id_fk',
      }),
      competencyReference: foreignKey({
        columns: [table.competencyId],
        foreignColumns: [competency.id],
        name: 'curriculum_competency_competency_id_fk',
      }),
    }
  },
)

export const curriculumGearLink = pgTable(
  'curriculum_gear_link',
  {
    curriculumId: uuid('curriculum_id').notNull(),
    gearTypeId: uuid('gear_type_id').notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.curriculumId, table.gearTypeId] }),
      curriculumReference: foreignKey({
        columns: [table.curriculumId],
        foreignColumns: [curriculum.id],
        name: 'curriculum_gear_link_curriculum_id_fk',
      }),
      gearTypeReference: foreignKey({
        columns: [table.gearTypeId],
        foreignColumns: [gearType.id],
        name: 'curriculum_gear_link_gear_type_id_fk',
      }),
    }
  },
)
