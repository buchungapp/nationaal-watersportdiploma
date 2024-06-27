import {
  foreignKey,
  numeric,
  pgTable,
  primaryKey,
  uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../utils/sql.js'
import { cohortAllocation } from './cohort.js'
import { curriculumCompetency } from './curriculum.js'

export const studentCohortProgress = pgTable(
  'student_cohort_progress',
  {
    cohortAllocationId: uuid('cohort_allocation_id').notNull(),
    competencyId: uuid('curriculum_module_competency_id').notNull(),
    progress: numeric('progress').notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.cohortAllocationId, table.competencyId],
        name: 'student_cohort_progress_pkey',
      }),
      studentCurriculumLinkReference: foreignKey({
        columns: [table.cohortAllocationId],
        foreignColumns: [cohortAllocation.id],
        name: 'student_cohort_progress_cohort_allocation_id_fk',
      }),
      competencyReference: foreignKey({
        columns: [table.competencyId],
        foreignColumns: [curriculumCompetency.id],
        name: 'curriculum_competency_competency_id_fk',
      }),
    }
  },
)
