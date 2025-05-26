import { schema as s } from "@nawadi/db";
import {
  and,
  asc,
  desc,
  eq,
  exists,
  getTableColumns,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  max,
  notExists,
  or,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  aliasedColumn,
  enforceArray,
  jsonAggBuildObject,
  jsonBuildObject,
  singleOrArray,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";

export const listByPersonId = wrapQuery(
  "cohort.student-progress.listByPersonId",
  withZod(
    z.object({
      personId: uuidSchema,
      respectProgressVisibility: z.boolean().default(false),
    }),
    async ({ personId, respectProgressVisibility }) => {
      const query = useQuery();

      const latestProgresses = query.$with("latest_progresses").as(
        query
          .select({
            competencyId: s.studentCohortProgress.competencyId,
            cohortAllocationId: s.studentCohortProgress.cohortAllocationId,
            updatedAt: max(s.studentCohortProgress.createdAt).as("updatedAt"),
          })
          .from(s.studentCohortProgress)
          .innerJoin(
            s.cohortAllocation,
            eq(
              s.cohortAllocation.id,
              s.studentCohortProgress.cohortAllocationId,
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
          .groupBy(
            s.studentCohortProgress.competencyId,
            s.studentCohortProgress.cohortAllocationId,
          ),
      );

      const latestProgress = query.$with("latest_progress").as(
        query
          .with(latestProgresses)
          .select({
            competencyId: latestProgresses.competencyId,
            cohortAllocationId: latestProgresses.cohortAllocationId,
            updatedAt: latestProgresses.updatedAt,
            progress: s.studentCohortProgress.progress,
          })
          .from(s.studentCohortProgress)
          .innerJoin(
            latestProgresses,
            and(
              eq(
                s.studentCohortProgress.competencyId,
                latestProgresses.competencyId,
              ),
              eq(
                s.studentCohortProgress.cohortAllocationId,
                latestProgresses.cohortAllocationId,
              ),
              eq(s.studentCohortProgress.createdAt, latestProgresses.updatedAt),
            ),
          ),
      );

      const withModulesProgress = query.$with("modules_progress").as(
        query
          .with(latestProgress)
          .select({
            cohortAllocationId: s.cohortAllocation.id,
            moduleId: aliasedColumn(s.module.id, "moduleId"),
            moduleHandle: aliasedColumn(s.module.handle, "moduleHandle"),
            moduleTitle: aliasedColumn(s.module.title, "moduleTitle"),
            moduleWeight: aliasedColumn(s.module.weight, "moduleWeight"),
            competencies: jsonAggBuildObject(
              {
                id: s.competency.id,
                handle: s.competency.handle,
                title: s.competency.title,
                weight: s.competency.weight,
                type: s.competency.type,
                requirement: s.curriculumCompetency.requirement,
                progress: sql<null | {
                  progress: number;
                  updatedAt: string;
                }>`CASE WHEN ${latestProgress.updatedAt} IS NOT NULL THEN ${jsonBuildObject(
                  {
                    progress: latestProgress.progress,
                    updatedAt: latestProgress.updatedAt,
                  },
                )} ELSE NULL END`,
                completed: sql<null | {
                  createdAt: string;
                  certificate: {
                    id: string;
                    handle: string;
                    issuedAt: string;
                  };
                }>`CASE WHEN ${s.certificate.id} IS NOT NULL THEN ${jsonBuildObject(
                  {
                    createdAt: s.studentCompletedCompetency.createdAt,
                    certificate: jsonBuildObject({
                      id: s.certificate.id,
                      handle: s.certificate.handle,
                      issuedAt: s.certificate.issuedAt,
                    }),
                  },
                )} ELSE NULL END`,
              },
              {
                orderBy: {
                  colName: s.competency.weight,
                  direction: "ASC",
                },
              },
            ).as("competencies"),
          })
          .from(s.curriculum)
          .innerJoin(
            s.curriculumModule,
            eq(s.curriculumModule.curriculumId, s.curriculum.id),
          )
          .innerJoin(s.module, eq(s.module.id, s.curriculumModule.moduleId))
          .innerJoin(
            s.curriculumCompetency,
            and(
              eq(s.curriculumCompetency.moduleId, s.module.id),
              eq(
                s.curriculumCompetency.curriculumId,
                s.curriculumModule.curriculumId,
              ),
            ),
          )
          .innerJoin(
            s.studentCurriculum,
            eq(s.studentCurriculum.curriculumId, s.curriculum.id),
          )
          .innerJoin(
            s.cohortAllocation,
            eq(s.cohortAllocation.studentCurriculumId, s.studentCurriculum.id),
          )
          .innerJoin(
            s.competency,
            eq(s.curriculumCompetency.competencyId, s.competency.id),
          )
          .leftJoin(
            s.studentCompletedCompetency,
            eq(
              s.studentCompletedCompetency.competencyId,
              s.curriculumCompetency.id,
            ),
          )
          .leftJoin(
            s.certificate,
            and(
              eq(s.certificate.id, s.studentCompletedCompetency.certificateId),
              or(
                isNull(s.certificate.visibleFrom),
                lte(s.certificate.visibleFrom, sql`NOW()`),
              ),
              isNotNull(s.certificate.issuedAt),
            ),
          )
          .leftJoin(
            latestProgress,
            and(
              eq(latestProgress.cohortAllocationId, s.cohortAllocation.id),
              eq(latestProgress.competencyId, s.curriculumCompetency.id),
            ),
          )
          .groupBy(s.module.id, s.cohortAllocation.id),
      );

      const rows = await query
        .with(withModulesProgress)
        .select({
          cohortAllocationId: s.cohortAllocation.id,
          progressVisibleUpUntil: s.cohortAllocation.progressVisibleUpUntil,
          location: {
            id: s.location.id,
            name: s.location.name,
          },
          gearType: {
            id: s.gearType.id,
            handle: s.gearType.handle,
            title: s.gearType.title,
          },
          program: {
            id: s.program.id,
            handle: s.program.handle,
            title: s.program.title,
          },
          degree: {
            id: s.degree.id,
            handle: s.degree.handle,
            title: s.degree.title,
          },
          modules: jsonAggBuildObject(
            {
              module: jsonBuildObject({
                id: withModulesProgress.moduleId,
                handle: withModulesProgress.moduleHandle,
                title: withModulesProgress.moduleTitle,
                weight: withModulesProgress.moduleWeight,
              }),
              competencies: withModulesProgress.competencies,
            },
            {
              orderBy: [
                {
                  // @ts-expect-error - The module weight doesn't have the column type because of the aliased column
                  colName: withModulesProgress.moduleWeight,
                  direction: "ASC",
                },
              ],
            },
          ).as("modules"),
        })
        .from(s.cohortAllocation)
        .innerJoin(s.actor, eq(s.cohortAllocation.actorId, s.actor.id))
        .innerJoin(
          s.studentCurriculum,
          eq(s.cohortAllocation.studentCurriculumId, s.studentCurriculum.id),
        )
        .innerJoin(s.cohort, eq(s.cohort.id, s.cohortAllocation.cohortId))
        .innerJoin(s.location, eq(s.cohort.locationId, s.location.id))
        .innerJoin(
          s.gearType,
          eq(s.studentCurriculum.gearTypeId, s.gearType.id),
        )
        .innerJoin(
          s.curriculum,
          eq(s.studentCurriculum.curriculumId, s.curriculum.id),
        )
        .innerJoin(s.program, eq(s.curriculum.programId, s.program.id))
        .innerJoin(s.degree, eq(s.program.degreeId, s.degree.id))

        .leftJoin(
          withModulesProgress,
          eq(s.cohortAllocation.id, withModulesProgress.cohortAllocationId),
        )
        .where(
          and(
            gte(s.cohort.accessEndTime, sql`NOW()`),
            lte(s.cohort.accessStartTime, sql`NOW()`),
            lte(s.cohortAllocation.progressVisibleUpUntil, sql`NOW()`),
            eq(s.actor.personId, personId),
          ),
        )
        .groupBy(
          s.cohortAllocation.id,
          s.location.id,
          s.gearType.id,
          s.program.id,
          s.degree.id,
        );

      return rows;
    },
  ),
);

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
