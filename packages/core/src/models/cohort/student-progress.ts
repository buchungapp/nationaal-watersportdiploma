import { schema as s } from "@nawadi/db";
import {
  and,
  asc,
  desc,
  eq,
  exists,
  getTableColumns,
  inArray,
  isNull,
  lte,
  max,
  notExists,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  enforceArray,
  singleOrArray,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";

export const byAllocationId = wrapQuery(
  "cohort.student-progress.byAllocationId",
  withZod(
    z.object({
      id: uuidSchema,
      respectProgressVisibility: z.boolean().default(false),
    }),
    async ({ id: cohortAllocationId, respectProgressVisibility }) => {
      const query = useQuery();

      const subquery = query
        .select({
          cohortAllocationId: s.studentCohortProgress.cohortAllocationId,
          competencyId: s.studentCohortProgress.competencyId,
          maxCreatedAt: max(s.studentCohortProgress.createdAt).as(
            "max_created_at",
          ),
        })
        .from(s.studentCohortProgress)
        .where(
          and(
            eq(s.studentCohortProgress.cohortAllocationId, cohortAllocationId),
            respectProgressVisibility
              ? exists(
                  query
                    .select({
                      id: sql`1`,
                    })
                    .from(s.cohortAllocation)
                    .where(
                      and(
                        eq(s.cohortAllocation.id, cohortAllocationId),
                        lte(
                          s.studentCohortProgress.createdAt,
                          s.cohortAllocation.progressVisibleUpUntil,
                        ),
                      ),
                    ),
                )
              : undefined,
          ),
        )
        .groupBy(
          s.studentCohortProgress.cohortAllocationId,
          s.studentCohortProgress.competencyId,
        )
        .as("latest");

      const rows = await query
        .select(getTableColumns(s.studentCohortProgress))
        .from(s.studentCohortProgress)
        .innerJoin(
          subquery,
          and(
            eq(
              s.studentCohortProgress.cohortAllocationId,
              subquery.cohortAllocationId,
            ),
            eq(s.studentCohortProgress.competencyId, subquery.competencyId),
            eq(s.studentCohortProgress.createdAt, subquery.maxCreatedAt),
          ),
        )
        .where(
          and(
            eq(s.studentCohortProgress.cohortAllocationId, cohortAllocationId),
          ),
        );

      return rows.map((row) => ({
        competencyId: row.competencyId,
        progress: row.progress,
        createdAt: row.createdAt,
      }));
    },
  ),
);

export const upsertProgress = wrapCommand(
  "cohort.student-progress.upsertProgress",
  withZod(
    z.object({
      cohortAllocationId: uuidSchema,
      competencyProgress: singleOrArray(
        z.object({
          competencyId: uuidSchema,
          progress: z.number().int().min(0).max(100),
        }),
      ),
      createdBy: uuidSchema,
    }),
    async (input) => {
      const query = useQuery();

      // TODO: We should check whether the competency belongs to the student curriculum

      const progressArray = enforceArray(input.competencyProgress);

      const result = await query
        .insert(s.studentCohortProgress)
        .values(
          progressArray.map(({ competencyId, progress }) => ({
            cohortAllocationId: input.cohortAllocationId,
            competencyId,
            progress: String(progress),
            createdBy: input.createdBy,
          })),
        )
        .returning({
          cohortAllocationId: s.studentCohortProgress.cohortAllocationId,
          competencyId: s.studentCohortProgress.competencyId,
        });

      return result;
    },
  ),
);

export const completeAllCoreCompetencies = wrapCommand(
  "cohort.student-progress.completeAllCoreCompetencies",
  withZod(
    z.object({
      cohortAllocationId: singleOrArray(uuidSchema),
      createdBy: uuidSchema,
    }),
    async (input) => {
      const query = useQuery();

      const uncompletedCoreCompetencies = await query
        .select({
          cohortAllocationId: s.cohortAllocation.id,
          competencyId: s.curriculumCompetency.id,
        })
        .from(s.cohortAllocation)
        .innerJoin(
          s.studentCurriculum,
          eq(s.cohortAllocation.studentCurriculumId, s.studentCurriculum.id),
        )
        .innerJoin(
          s.curriculumCompetency,
          eq(
            s.studentCurriculum.curriculumId,
            s.curriculumCompetency.curriculumId,
          ),
        )
        .where(
          and(
            Array.isArray(input.cohortAllocationId)
              ? inArray(s.cohortAllocation.id, input.cohortAllocationId)
              : eq(s.cohortAllocation.id, input.cohortAllocationId),
            eq(s.curriculumCompetency.isRequired, true),
            notExists(
              query
                .select({ id: sql`1` })
                .from(s.studentCohortProgress)
                .where(
                  and(
                    eq(
                      s.studentCohortProgress.cohortAllocationId,
                      s.cohortAllocation.id,
                    ),
                    eq(
                      s.studentCohortProgress.competencyId,
                      s.curriculumCompetency.competencyId,
                    ),
                  ),
                ),
            ),
            notExists(
              query
                .select({ id: sql`1` })
                .from(s.studentCompletedCompetency)
                .where(
                  and(
                    eq(
                      s.studentCompletedCompetency.competencyId,
                      s.curriculumCompetency.competencyId,
                    ),
                    isNull(s.studentCompletedCompetency.deletedAt),
                  ),
                ),
            ),
            isNull(s.cohortAllocation.deletedAt),
          ),
        );

      const result = await query
        .insert(s.studentCohortProgress)
        .values(
          uncompletedCoreCompetencies.map(
            ({ competencyId, cohortAllocationId }) => ({
              cohortAllocationId,
              competencyId,
              progress: "100",
              createdBy: input.createdBy,
            }),
          ),
        )
        .returning({
          cohortAllocationId: s.studentCohortProgress.cohortAllocationId,
          competencyId: s.studentCohortProgress.competencyId,
        });

      return result;
    },
  ),
);

export const retrieveHistoryByAllocationId = wrapQuery(
  "cohort.student-progress.retrieveHistoryByAllocationId",
  withZod(
    z.object({
      allocationId: z.string().uuid(),
    }),
    async ({ allocationId }) => {
      const query = useQuery();

      const { competencyId, progress, createdAt } = getTableColumns(
        s.studentCohortProgress,
      );

      const rows = await query
        .select({
          competencyId,
          progress,
          createdAt,
          person: {
            id: s.person.id,
            firstName: s.person.firstName,
            lastNamePrefix: s.person.lastNamePrefix,
            lastName: s.person.lastName,
          },
          module: {
            id: s.module.id,
            title: s.module.title,
            weight: s.module.weight,
          },
          competency: {
            id: s.competency.id,
            title: s.competency.title,
            weight: s.competency.weight,
          },
        })
        .from(s.studentCohortProgress)
        .innerJoin(s.person, eq(s.studentCohortProgress.createdBy, s.person.id))
        .innerJoin(
          s.curriculumCompetency,
          eq(s.studentCohortProgress.competencyId, s.curriculumCompetency.id),
        )
        .innerJoin(
          s.competency,
          eq(s.curriculumCompetency.competencyId, s.competency.id),
        )
        .innerJoin(s.module, eq(s.curriculumCompetency.moduleId, s.module.id))
        .where(
          and(eq(s.studentCohortProgress.cohortAllocationId, allocationId)),
        )
        .orderBy(
          desc(s.studentCohortProgress.createdAt),
          asc(s.module.weight),
          asc(s.competency.weight),
        );

      return rows;
    },
  ),
);
