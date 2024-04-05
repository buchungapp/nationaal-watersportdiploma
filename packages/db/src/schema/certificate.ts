import {
  foreignKey,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { curriculumCompetency, curriculumGearLink } from './curriculum'
import { location } from './location'

export const studentCurriculum = pgTable(
  'student_curriculum',
  {
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
      pk: primaryKey({
        columns: [table.identityId, table.curriculumId, table.gearTypeId],
      }),
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
        foreignColumns: [curriculumGearLink.curriculumId],
        name: 'student_curriculum_link_curriculum_id_fk',
      }),
      gearTypeReference: foreignKey({
        columns: [table.gearTypeId],
        foreignColumns: [curriculumGearLink.gearTypeId],
        name: 'student_curriculum_link_gear_type_id_fk',
      }),
    }
  },
)

export const certificate = pgTable(
  'certificate',
  {
    id: uuid('id').primaryKey().notNull(),
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
      studentCurriculumReference: foreignKey({
        columns: [table.studentCurriculumId],
        foreignColumns: [studentCurriculum.identityId],
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
      }),
      studentCurriculumLinkReference: foreignKey({
        columns: [table.studentCurriculumId],
        foreignColumns: [studentCurriculum.identityId],
        name: 'student_completed_competency_student_curriculum_link_id_fk',
      }),
      competencyReference: foreignKey({
        columns: [table.competencyId],
        foreignColumns: [curriculumCompetency.competencyId],
        name: 'student_completed_competency_competency_id_fk',
      }),
      certificateReference: foreignKey({
        columns: [table.certificateId],
        foreignColumns: [certificate.id],
        name: 'student_completed_competency_certificate_id_fk',
      }),
    }
  },
)
