import { sql } from "drizzle-orm";
import { foreignKey, index, numeric, pgTable, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../utils/sql.js";
import { cohortAllocation } from "./cohort.js";
import { curriculumCompetency } from "./curriculum.js";
import { person } from "./user.js";

const { createdAt } = timestamps;

export const studentCohortProgress = pgTable(
  "student_cohort_progress",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    cohortAllocationId: uuid("cohort_allocation_id").notNull(),
    competencyId: uuid("curriculum_module_competency_id").notNull(),
    progress: numeric("progress").notNull(),
    createdAt,
    createdBy: uuid("created_by").notNull(),
  },
  (table) => {
    return {
      studentCurriculumLinkReference: foreignKey({
        columns: [table.cohortAllocationId],
        foreignColumns: [cohortAllocation.id],
        name: "student_cohort_progress_cohort_allocation_id_fk",
      }),
      competencyReference: foreignKey({
        columns: [table.competencyId],
        foreignColumns: [curriculumCompetency.id],
        name: "curriculum_competency_competency_id_fk",
      }),
      createdByReference: foreignKey({
        columns: [table.createdBy],
        foreignColumns: [person.id],
        name: "student_cohort_progress_created_by_fk",
      }),
      cohortAllocationIdIdx: index("cohort_allocation_id_idx").on(
        table.cohortAllocationId,
        table.createdAt.desc(),
        table.competencyId,
      ),
    };
  },
);
