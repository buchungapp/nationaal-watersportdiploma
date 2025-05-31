import { schema as s } from "@nawadi/db";
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
  enforceArray,
  handleSchema,
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
        cohortId: uuidSchema,
        allocationId: uuidSchema,
        studentCurriculumId: uuidSchema,
        curriculumId: uuidSchema,
        location: z.object({
          id: uuidSchema,
          handle: handleSchema,
          name: z.string().nullable(),
        }),
        progressVisibleUpUntil: z.string(),
        program: z.object({
          id: uuidSchema,
          handle: handleSchema,
          name: z.string().nullable(),
        }),
        degree: z.object({
          id: uuidSchema,
          handle: handleSchema,
          name: z.string().nullable(),
        }),
        course: z.object({
          id: uuidSchema,
          handle: handleSchema,
          name: z.string().nullable(),
        }),
        gearType: z.object({
          id: uuidSchema,
          handle: handleSchema,
          name: z.string().nullable(),
        }),
        progress: z
          .object({
            competencyId: uuidSchema,
            progress: z.number().int().min(0).max(100),
            createdAt: z.string(),
          })
          .array(),
      })
      .array(),
    async ({
      personId,
      respectProgressVisibility,
      respectCohortVisibility,
    }) => {
      const query = useQuery();

      const withAllocationProgress = query.$with("allocation_progress").as(
        query
          .selectDistinctOn(
            [
              s.studentCohortProgress.competencyId,
              s.studentCohortProgress.cohortAllocationId,
            ],
            {
              cohortAllocationId: s.studentCohortProgress.cohortAllocationId,
              competencyId: s.studentCohortProgress.competencyId,
              progress: s.studentCohortProgress.progress,
              createdAt: s.studentCohortProgress.createdAt,
            },
          )
          .from(s.studentCohortProgress)
          .innerJoin(
            s.cohortAllocation,
            eq(
              s.studentCohortProgress.cohortAllocationId,
              s.cohortAllocation.id,
            ),
          )
          .innerJoin(s.actor, eq(s.cohortAllocation.actorId, s.actor.id))
          .where(
            and(
              eq(s.actor.personId, personId),
              eq(s.actor.type, "student"),
              respectProgressVisibility
                ? lte(
                    s.studentCohortProgress.createdAt,
                    s.cohortAllocation.progressVisibleUpUntil,
                  )
                : undefined,
            ),
          )
          .orderBy(
            s.studentCohortProgress.competencyId,
            s.studentCohortProgress.cohortAllocationId,
            desc(s.studentCohortProgress.createdAt),
          ),
      );

      const rows = await query
        .with(withAllocationProgress)
        .select({
          cohortId: s.cohort.id,
          allocationId: s.cohortAllocation.id,
          studentCurriculumId: s.cohortAllocation.studentCurriculumId,
          curriculumId: s.studentCurriculum.curriculumId,
          competencyId: withAllocationProgress.competencyId,
          progress: withAllocationProgress.progress,
          progressVisibleUpUntil: s.cohortAllocation.progressVisibleUpUntil,
          gearType: {
            id: s.gearType.id,
            handle: s.gearType.handle,
            name: s.gearType.title,
          },
          program: {
            id: s.program.id,
            handle: s.program.handle,
            name: s.program.title,
          },
          degree: {
            id: s.degree.id,
            handle: s.degree.handle,
            name: s.degree.title,
          },
          course: {
            id: s.course.id,
            handle: s.course.handle,
            name: s.course.title,
          },
          location: {
            id: s.location.id,
            handle: s.location.handle,
            name: s.location.name,
          },
          createdAt: withAllocationProgress.createdAt,
        })
        .from(s.cohortAllocation)
        .innerJoin(s.actor, eq(s.cohortAllocation.actorId, s.actor.id))
        .innerJoin(s.cohort, eq(s.cohortAllocation.cohortId, s.cohort.id))
        .innerJoin(
          s.studentCurriculum,
          eq(s.cohortAllocation.studentCurriculumId, s.studentCurriculum.id),
        )
        .innerJoin(
          s.curriculum,
          eq(s.studentCurriculum.curriculumId, s.curriculum.id),
        )
        .innerJoin(s.program, eq(s.curriculum.programId, s.program.id))
        .innerJoin(s.degree, eq(s.program.degreeId, s.degree.id))
        .innerJoin(s.course, eq(s.program.courseId, s.course.id))
        .innerJoin(
          s.gearType,
          eq(s.studentCurriculum.gearTypeId, s.gearType.id),
        )
        .innerJoin(s.location, eq(s.cohort.locationId, s.location.id))
        .leftJoin(
          withAllocationProgress,
          eq(withAllocationProgress.cohortAllocationId, s.cohortAllocation.id),
        )
        .where(
          and(
            eq(s.actor.personId, personId),
            eq(s.actor.type, "student"),
            isNotNull(s.cohortAllocation.studentCurriculumId),
            isNull(s.actor.deletedAt),
            isNull(s.cohortAllocation.deletedAt),
            isNull(s.cohort.deletedAt),
            isNull(s.studentCurriculum.deletedAt),
            isNull(s.location.deletedAt),
            respectCohortVisibility
              ? and(
                  gte(s.cohort.accessEndTime, sql`NOW()`),
                  lte(s.cohort.accessStartTime, sql`NOW()`),
                )
              : undefined,
          ),
        )
        .orderBy(s.cohortAllocation.id, withAllocationProgress.competencyId);

      // Group progress by allocation
      const groupedResults = new Map<
        string,
        {
          cohortId: string;
          allocationId: string;
          studentCurriculumId: string;
          curriculumId: string;
          location: {
            id: string;
            handle: string;
            name: string | null;
          };
          program: {
            id: string;
            handle: string;
            name: string | null;
          };
          degree: {
            id: string;
            handle: string;
            name: string | null;
          };
          course: {
            id: string;
            handle: string;
            name: string | null;
          };
          gearType: {
            id: string;
            handle: string;
            name: string | null;
          };
          progressVisibleUpUntil: string;
          progress: Array<{
            competencyId: string;
            progress: number;
            createdAt: string;
          }>;
        }
      >();

      for (const row of rows) {
        const key = row.allocationId;

        if (!groupedResults.has(key)) {
          if (!row.studentCurriculumId) continue;

          groupedResults.set(key, {
            cohortId: row.cohortId,
            allocationId: row.allocationId,
            studentCurriculumId: row.studentCurriculumId,
            curriculumId: row.curriculumId,
            gearType: {
              id: row.gearType.id,
              handle: row.gearType.handle,
              name: row.gearType.name,
            },
            program: {
              id: row.program.id,
              handle: row.program.handle,
              name: row.program.name,
            },
            degree: {
              id: row.degree.id,
              handle: row.degree.handle,
              name: row.degree.name,
            },
            course: {
              id: row.course.id,
              handle: row.course.handle,
              name: row.course.name,
            },
            // biome-ignore lint/style/noNonNullAssertion: Part of the where clause
            progressVisibleUpUntil: row.progressVisibleUpUntil!,
            location: {
              id: row.location.id,
              handle: row.location.handle,
              name: row.location.name,
            },
            progress: [],
          });
        }

        // Only add progress if it exists (left join might return null)
        if (row.competencyId && row.progress !== null && row.createdAt) {
          const allocation = groupedResults.get(key);
          if (allocation) {
            allocation.progress.push({
              competencyId: row.competencyId,
              progress: Number.parseInt(row.progress, 10),
              createdAt: row.createdAt,
            });
          }
        }
      }

      return Array.from(groupedResults.values());
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
