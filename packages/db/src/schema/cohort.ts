import { sql } from 'drizzle-orm'
import {
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../utils/sql.js'
import { studentCurriculum } from './certificate.js'
import { location } from './location.js'
import { actor } from './user.js'

export const cohort = pgTable(
  'cohort',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text('handle').notNull(),
    label: text('revision').notNull(),
    locationId: uuid('location_id').notNull(),
    accessStartTime: timestamp('access_start_time', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    accessEndTime: timestamp('access_end_time', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    certificatesVisibleFrom: timestamp('certificates_visible_from', {
      withTimezone: true,
      mode: 'string',
    }),
    ...timestamps,
  },
  (table) => {
    return {
      unqHandle: uniqueIndex().on(table.handle),
      locationReference: foreignKey({
        columns: [table.locationId],
        foreignColumns: [location.id],
        name: 'cohort_location_id_fk',
      }),
    }
  },
)

export const cohortAllocation = pgTable(
  'cohort_allocation',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    cohortId: uuid('cohort_id').notNull(),
    actorId: uuid('actor_id').notNull(),
    studentCurriculumId: uuid('student_curriculum_id'),
    tags: text('tags')
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    ...timestamps,
  },
  (table) => {
    return {
      unqCohortActorCurriculum: uniqueIndex().on(
        table.cohortId,
        table.actorId,
        table.studentCurriculumId,
      ),
      idxCohortTags: index().on(table.cohortId, table.tags),
      cohortReference: foreignKey({
        columns: [table.cohortId],
        foreignColumns: [cohort.id],
        name: 'cohort_allocation_cohort_id_fk',
      }),
      actorReference: foreignKey({
        columns: [table.actorId],
        foreignColumns: [actor.id],
        name: 'cohort_allocation_actor_id_fk',
      }),
      studentCurriculumReference: foreignKey({
        columns: [table.studentCurriculumId],
        foreignColumns: [studentCurriculum.id],
        name: 'cohort_allocation_student_curriculum_id_fk',
      }),
    }
  },
)
