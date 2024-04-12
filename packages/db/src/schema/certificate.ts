import { sql } from 'drizzle-orm'
import {
  foreignKey,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import {
  curriculum,
  curriculumCompetency,
  curriculumGearLink,
} from './curriculum'
import { location } from './location'
import { gearType } from './program'
import { identity } from './user'

export const studentCurriculum = pgTable(
  'student_curriculum',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    identityId: uuid('identity_id').notNull(),
    curriculumId: uuid('curriculum_id').notNull(),
    gearTypeId: uuid('gear_type_id').notNull(),
    startedAt: timestamp('started_at', {
      withTimezone: true,
      mode: 'string',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      unqIdentityCurriculumGear: uniqueIndex(
        'student_curriculum_unq_identity_gear_curriculum',
      ).on(table.identityId, table.curriculumId, table.gearTypeId),
      curriculumGearTypeReference: foreignKey({
        columns: [table.curriculumId, table.gearTypeId],
        foreignColumns: [
          curriculumGearLink.curriculumId,
          curriculumGearLink.gearTypeId,
        ],
        name: 'student_curriculum_link_curriculum_id_gear_type_id_fk',
      }),
      curriculumReference: foreignKey({
        columns: [table.curriculumId],
        foreignColumns: [curriculum.id],
        name: 'student_curriculum_link_curriculum_id_fk',
      }),
      gearTypeReference: foreignKey({
        columns: [table.gearTypeId],
        foreignColumns: [gearType.id],
        name: 'student_curriculum_link_gear_type_id_fk',
      }),
      identityReference: foreignKey({
        columns: [table.identityId],
        foreignColumns: [identity.id],
        name: 'student_curriculum_link_identity_id_fk',
      }),
    }
  },
)

export const certificate = pgTable(
  'certificate',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text('handle').notNull(),
    studentCurriculumId: uuid('student_curriculum_id').notNull(),
    locationId: uuid('location_id').notNull(),
    issuedAt: timestamp('issued_at', {
      withTimezone: true,
      mode: 'string',
    }),
    visibleFrom: timestamp('visible_from', {
      withTimezone: true,
      mode: 'string',
    }),
  },
  (table) => {
    return {
      unqHandle: uniqueIndex('certificate_unq_handle').on(table.handle),
      studentCurriculumReference: foreignKey({
        columns: [table.studentCurriculumId],
        foreignColumns: [studentCurriculum.id],
        name: 'certificate_student_curriculum_link_id_fk',
      }),
      locationReference: foreignKey({
        columns: [table.locationId],
        foreignColumns: [location.id],
        name: 'certificate_location_id_fk',
      }),
    }
  },
)

export const studentCompletedCompetency = pgTable(
  'student_completed_competency',
  {
    studentCurriculumId: uuid('student_curriculum_id').notNull(),
    competencyId: uuid('curriculum_module_competency_id').notNull(),
    certificateId: uuid('certificate_id').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.studentCurriculumId, table.competencyId],
        name: 'student_completed_competency_pk',
      }),
      studentCurriculumLinkReference: foreignKey({
        columns: [table.studentCurriculumId],
        foreignColumns: [studentCurriculum.id],
        name: 'student_completed_competency_student_curriculum_link_id_fk',
      }),
      competencyReference: foreignKey({
        columns: [table.competencyId],
        foreignColumns: [curriculumCompetency.id],
        name: 'curriculum_competency_competency_id_fk',
      }),
      certificateReference: foreignKey({
        columns: [table.certificateId],
        foreignColumns: [certificate.id],
        name: 'student_completed_competency_certificate_id_fk',
      }),
    }
  },
)
