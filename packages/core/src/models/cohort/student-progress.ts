import { schema as s } from "@nawadi/db";
import dayjs from "dayjs";
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  notExists,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  dateTimeSchema,
  enforceArray,
  handleSchema,
  jsonAggBuildObject,
  singleOrArray,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";

export const listByPersonId = wrapQuery(
  "cohort.studentProgress.listByPersonId",
  withZod(
    z.object({
      personId: uuidSchema,
      respectProgressVisibility: z.boolean().default(false),
      respectCohortVisibility: z.boolean().default(false),
    }),
    z
      .object({
        allocation: z.object({
          id: uuidSchema,
          cohort: z.object({
            id: uuidSchema,
            location: z.object({
              id: uuidSchema,
              handle: handleSchema,
              name: z.string().nullable(),
            }),
          }),
        }),
        studentCurriculumId: uuidSchema,
        progress: z
          .object({
            competencyId: uuidSchema,
            moduleId: uuidSchema,
            progress: z.number().int().min(0).max(100),
            createdAt: dateTimeSchema,
          })
          .array(),
        progressVisibleUpUntil: dateTimeSchema.nullable(),
      })
      .array(),
    async ({
      personId,
      respectProgressVisibility,
      respectCohortVisibility,
    }) => {
      const query = useQuery();

      const latestProgress = query.$with("latest_progress").as(
        query
          .selectDistinctOn(
            [
              s.studentCohortProgress.cohortAllocationId,
              s.studentCohortProgress.competencyId,
            ],
            {
              cohortAllocationId: s.studentCohortProgress.cohortAllocationId,
              competencyId: s.studentCohortProgress.competencyId,
              moduleId: s.curriculumCompetency.moduleId,
              progress: s.studentCohortProgress.progress,
              createdAt: s.studentCohortProgress.createdAt,
            },
          )
          .from(s.studentCohortProgress)
          .innerJoin(
            s.curriculumCompetency,
            eq(s.studentCohortProgress.competencyId, s.curriculumCompetency.id),
          )
          .innerJoin(
            s.cohortAllocation,
            eq(
              s.studentCohortProgress.cohortAllocationId,
              s.cohortAllocation.id,
            ),
          )
          .where(
            respectProgressVisibility
              ? lte(
                  s.studentCohortProgress.createdAt,
                  s.cohortAllocation.progressVisibleUpUntil,
                )
              : undefined,
          )
          .orderBy(
            s.studentCohortProgress.cohortAllocationId,
            s.studentCohortProgress.competencyId,
            desc(s.studentCohortProgress.createdAt),
          ),
      );

      const rows = await query
        .with(latestProgress)
        .select({
          allocationId: s.cohortAllocation.id,
          cohortId: s.cohort.id,
          locationId: s.location.id,
          locationHandle: s.location.handle,
          locationName: s.location.name,
          studentCurriculumId: s.cohortAllocation.studentCurriculumId,
          progress: jsonAggBuildObject({
            competencyId: latestProgress.competencyId,
            moduleId: latestProgress.moduleId,
            progress: sql<number>`${latestProgress.progress}::integer`,
            createdAt: latestProgress.createdAt,
          }).as("progress"),
          progressVisibleUpUntil: s.cohortAllocation.progressVisibleUpUntil,
        })
        .from(s.cohortAllocation)
        .innerJoin(s.actor, eq(s.cohortAllocation.actorId, s.actor.id))
        .innerJoin(s.cohort, eq(s.cohortAllocation.cohortId, s.cohort.id))
        .innerJoin(s.location, eq(s.cohort.locationId, s.location.id))
        .leftJoin(
          latestProgress,
          eq(latestProgress.cohortAllocationId, s.cohortAllocation.id),
        )
        .where(
          and(
            eq(s.actor.personId, personId),
            eq(s.actor.type, "student"),
            isNotNull(s.cohortAllocation.studentCurriculumId),
            isNull(s.actor.deletedAt),
            isNull(s.cohortAllocation.deletedAt),
            isNull(s.cohort.deletedAt),
            isNull(s.location.deletedAt),
            respectCohortVisibility
              ? and(
                  gte(s.cohort.accessEndTime, sql`NOW()`),
                  lte(s.cohort.accessStartTime, sql`NOW()`),
                )
              : undefined,
            respectProgressVisibility
              ? lte(s.cohortAllocation.progressVisibleUpUntil, sql`NOW()`)
              : undefined,
          ),
        )
        .groupBy(s.cohortAllocation.id, s.cohort.id, s.location.id);

      return rows.map((row) => ({
        allocation: {
          id: row.allocationId,
          cohort: {
            id: row.cohortId,
            location: {
              id: row.locationId,
              handle: row.locationHandle,
              name: row.locationName,
            },
          },
        },
        studentCurriculumId: row.studentCurriculumId as string,
        progress: row.progress.map((p) => ({
          competencyId: p.competencyId,
          moduleId: p.moduleId,
          progress: p.progress,
          createdAt: dayjs(p.createdAt).toISOString(),
        })),
        progressVisibleUpUntil: row.progressVisibleUpUntil
          ? dayjs(row.progressVisibleUpUntil).toISOString()
          : null,
      }));
    },
  ),
);

export const byAllocationId = wrapQuery(
  "cohort.studentProgress.byAllocationId",
  withZod(
    z.object({
      id: uuidSchema,
      respectProgressVisibility: z.boolean().default(false),
    }),
    async ({ id: cohortAllocationId, respectProgressVisibility }) => {
      const query = useQuery();

      const rows = await query
        .selectDistinctOn([s.studentCohortProgress.competencyId], {
          competencyId: s.studentCohortProgress.competencyId,
          progress: s.studentCohortProgress.progress,
          createdAt: s.studentCohortProgress.createdAt,
        })
        .from(s.studentCohortProgress)
        .where(
          and(
            eq(s.studentCohortProgress.cohortAllocationId, cohortAllocationId),
            respectProgressVisibility
              ? lte(
                  s.studentCohortProgress.createdAt,
                  query
                    .select({
                      progressVisibleUpUntil:
                        s.cohortAllocation.progressVisibleUpUntil,
                    })
                    .from(s.cohortAllocation)
                    .where(eq(s.cohortAllocation.id, cohortAllocationId)),
                )
              : undefined,
          ),
        )
        .orderBy(
          s.studentCohortProgress.competencyId,
          desc(s.studentCohortProgress.createdAt),
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
