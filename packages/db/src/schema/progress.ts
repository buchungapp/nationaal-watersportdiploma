import {
  foreignKey,
  numeric,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { studentCurriculum } from './certificate.js'
import { curriculumCompetency } from './curriculum.js'
import { location } from './location.js'

export const studentCompetencyProgress = pgTable(
  'student_competency_progress',
  {
    studentCurriculumId: uuid('student_curriculum_id').notNull(),
    competencyId: uuid('curriculum_module_competency_id').notNull(),
    locationId: uuid('location_id').notNull(),
    progress: numeric('progress').notNull(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'string',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [
          table.studentCurriculumId,
          table.competencyId,
          table.locationId,
        ],
        name: 'student_competency_progress_pk',
      }),
      studentCurriculumLinkReference: foreignKey({
        columns: [table.studentCurriculumId],
        foreignColumns: [studentCurriculum.id],
        name: 'student_curriculum_progress_student_curriculum_link_id_fk',
      }),
      competencyReference: foreignKey({
        columns: [table.competencyId],
        foreignColumns: [curriculumCompetency.id],
        name: 'curriculum_competency_competency_id_fk',
      }),
      locationReference: foreignKey({
        columns: [table.locationId],
        foreignColumns: [location.id],
        name: 'student_curriculum_progress_location_id_fk',
      }),
    }
  },
)
