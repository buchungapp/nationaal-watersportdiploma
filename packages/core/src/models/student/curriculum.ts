import { schema as s } from "@nawadi/db";
import {
  and,
  countDistinct,
  eq,
  exists,
  inArray,
  isNotNull,
  isNull,
  lte,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  aliasedColumn,
  dateTimeSchema,
  jsonAggBuildObject,
  jsonBuildObject,
  possibleSingleRow,
  singleOrArray,
  successfulCreateResponse,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import { insertSchema, outputSchema } from "./curriculum.schema.js";

export * as $schema from "./curriculum.schema.js";

export const start = wrapCommand(
  "student.curriculum.start",
  withZod(
    insertSchema.pick({
      personId: true,
      curriculumId: true,
      gearTypeId: true,
      startedAt: true,
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const [insert] = await query
        .insert(s.studentCurriculum)
        .values({
          personId: input.personId,
          curriculumId: input.curriculumId,
          gearTypeId: input.gearTypeId,
          startedAt: input.startedAt,
        })
        .returning({ id: s.studentCurriculum.id });

      if (!insert) {
        throw new Error("Failed to start program");
      }

      return insert;
    },
  ),
);

export const findOrEnroll = wrapCommand(
  "student.curriculum.findOrEnroll",
  withZod(
    insertSchema.pick({
      personId: true,
      curriculumId: true,
      gearTypeId: true,
      startedAt: true,
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      // Check for existing student curriculum
      const existingCurriculum = await query
        .select({ id: s.studentCurriculum.id })
        .from(s.studentCurriculum)
        .where(
          and(
            eq(s.studentCurriculum.personId, input.personId),
            eq(s.studentCurriculum.curriculumId, input.curriculumId),
            eq(s.studentCurriculum.gearTypeId, input.gearTypeId),
            isNull(s.studentCurriculum.deletedAt),
          ),
        )
        .then(possibleSingleRow);

      if (existingCurriculum) {
        return existingCurriculum;
      }

      const [insert] = await query
        .insert(s.studentCurriculum)
        .values({
          personId: input.personId,
          curriculumId: input.curriculumId,
          gearTypeId: input.gearTypeId,
          startedAt: input.startedAt,
        })
        .returning({ id: s.studentCurriculum.id });

      if (!insert) {
        throw new Error("Failed to start program");
      }

      return insert;
    },
  ),
);

export const listCompletedCompetenciesById = wrapQuery(
  "student.curriculum.listCompletedCompetenciesById",
  withZod(
    z.object({
      id: uuidSchema,
    }),
    async (input) => {
      const query = useQuery();

      const rows = await query
        .select()
        .from(s.studentCompletedCompetency)
        .where(
          and(
            eq(s.studentCompletedCompetency.studentCurriculumId, input.id),
            isNull(s.studentCompletedCompetency.deletedAt),
            exists(
              query
                .select({ id: sql`1` })
                .from(s.studentCurriculum)
                .where(
                  and(
                    eq(s.studentCurriculum.id, input.id),
                    isNull(s.studentCurriculum.deletedAt),
                  ),
                ),
            ),
            exists(
              query
                .select({ id: sql`1` })
                .from(s.certificate)
                .where(
                  and(
                    eq(
                      s.certificate.id,
                      s.studentCompletedCompetency.certificateId,
                    ),
                    isNull(s.certificate.deletedAt),
                    isNotNull(s.certificate.issuedAt),
                  ),
                ),
            ),
          ),
        );

      return rows.map((row) => ({
        certificateId: row.certificateId,
        competencyId: row.competencyId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
    },
  ),
);

export const listByPersonId = wrapQuery(
  "student.curriculum.listByPersonId",
  withZod(
    z.object({
      personId: singleOrArray(uuidSchema),
      filters: z
        .object({
          atLeastOneModuleCompleted: z.boolean().default(false),
        })
        .default({}),
    }),
    outputSchema.array(),
    async (input) => {
      const query = useQuery();

      const personIds = Array.isArray(input.personId)
        ? input.personId
        : [input.personId];

      const withModuleCompetencies = query.$with("module_competencies").as(
        query
          .select({
            curriculumId: aliasedColumn(
              s.curriculum.id,
              "module_competencies_curriculum_id",
            ),
            moduleId: aliasedColumn(
              s.module.id,
              "module_competencies_module_id",
            ),
            moduleHandle: s.module.handle,
            moduleTitle: s.module.title,
            moduleWeight: s.module.weight,
            competencies: jsonAggBuildObject(
              {
                id: s.curriculumCompetency.id,
                competencyId: s.competency.id,
                handle: s.competency.handle,
                title: s.competency.title,
                weight: s.competency.weight,
                type: s.competency.type,
                isRequired: s.curriculumCompetency.isRequired,
                requirement: s.curriculumCompetency.requirement,
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
            s.competency,
            eq(s.curriculumCompetency.competencyId, s.competency.id),
          )
          .groupBy(s.module.id, s.curriculum.id),
      );

      const rows = await query
        .with(withModuleCompetencies)
        .select({
          id: s.studentCurriculum.id,
          personId: s.studentCurriculum.personId,
          startedAt: s.studentCurriculum.startedAt,
          curriculum: {
            id: s.curriculum.id,
            revision: s.curriculum.revision,
            startedAt: s.curriculum.startedAt,
            program: jsonBuildObject({
              id: s.program.id,
              handle: s.program.handle,
              title: s.program.title,
              course: jsonBuildObject({
                id: s.course.id,
                handle: s.course.handle,
                title: s.course.title,
              }),
              degree: jsonBuildObject({
                id: s.degree.id,
                handle: s.degree.handle,
                title: s.degree.title,
                rang: s.degree.rang,
              }),
            }),
            modules: jsonAggBuildObject(
              {
                id: withModuleCompetencies.moduleId,
                handle: withModuleCompetencies.moduleHandle,
                title: withModuleCompetencies.moduleTitle,
                weight: withModuleCompetencies.moduleWeight,
                competencies: withModuleCompetencies.competencies,
                isRequired: sql<boolean>`COALESCE(
                  (
                    SELECT bool_and(competency.value->>'isRequired' = 'true')
                    FROM jsonb_array_elements(${withModuleCompetencies.competencies}) AS competency
                  ),
                  false
                )`,
                type: sql<"knowledge" | "skill">`(
                  SELECT (competency.value->>'type')::text
                  FROM jsonb_array_elements(${withModuleCompetencies.competencies}) AS competency
                  LIMIT 1
                )`,
              },
              {
                orderBy: {
                  colName: withModuleCompetencies.moduleWeight,
                  direction: "ASC",
                },
              },
            ).as("modules"),
          },
          gearType: {
            id: s.gearType.id,
            handle: s.gearType.handle,
            title: s.gearType.title,
          },
        })
        .from(s.studentCurriculum)
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
        .leftJoin(
          withModuleCompetencies,
          eq(s.curriculum.id, withModuleCompetencies.curriculumId),
        )
        .where(
          and(
            inArray(s.studentCurriculum.personId, personIds),
            isNull(s.studentCurriculum.deletedAt),
            input.filters.atLeastOneModuleCompleted
              ? exists(
                  // This only checks for completed competencies, not a whole module
                  // but business logic enforces that a competency can only be completed
                  // if the whole module is completed
                  query
                    .select({ id: sql`1` })
                    .from(s.studentCompletedCompetency)
                    .where(
                      eq(
                        s.studentCompletedCompetency.studentCurriculumId,
                        s.studentCurriculum.id,
                      ),
                    ),
                )
              : undefined,
          ),
        )
        .groupBy(
          s.studentCurriculum.id,
          s.curriculum.id,
          s.program.id,
          s.course.id,
          s.degree.id,
          s.gearType.id,
        );

      return rows;
    },
  ),
);

export const listProgressByPersonId = wrapQuery(
  "student.curriculum.listProgressByPersonId",
  withZod(
    z.object({
      personId: singleOrArray(uuidSchema),
      filters: z
        .object({
          respectCertificateVisibility: z.boolean().default(false),
          includeCurriculaWithoutProgress: z.boolean().default(false),
        })
        .default({}),
    }),
    z
      .object({
        personId: uuidSchema,
        studentCurriculumId: uuidSchema,
        modules: z
          .object({
            moduleId: uuidSchema,
            certificateId: uuidSchema,
          })
          .array(),
        certificates: z
          .object({
            id: uuidSchema,
            handle: z.string(),
            issuedAt: dateTimeSchema,
            location: z.object({
              id: uuidSchema,
              handle: z.string(),
              name: z.string().nullable(),
            }),
          })
          .array(),
      })
      .array(),
    async (input) => {
      const query = useQuery();

      const personIds = Array.isArray(input.personId)
        ? input.personId
        : [input.personId];

      const withModules = query.$with("modules").as(
        query
          .selectDistinct({
            personId: aliasedColumn(
              s.studentCurriculum.personId,
              "modules_person_id",
            ),
            studentCurriculumId: aliasedColumn(
              s.studentCurriculum.id,
              "modules_student_curriculum_id",
            ),
            moduleId: aliasedColumn(
              s.curriculumCompetency.moduleId,
              "modules_module_id",
            ),
            certificateId: aliasedColumn(
              s.certificate.id,
              "modules_certificate_id",
            ),
          })
          .from(s.studentCurriculum)
          .innerJoin(
            s.studentCompletedCompetency,
            eq(
              s.studentCompletedCompetency.studentCurriculumId,
              s.studentCurriculum.id,
            ),
          )
          .innerJoin(
            s.curriculumCompetency,
            eq(
              s.studentCompletedCompetency.competencyId,
              s.curriculumCompetency.id,
            ),
          )
          .innerJoin(
            s.certificate,
            and(
              eq(s.certificate.id, s.studentCompletedCompetency.certificateId),
              isNotNull(s.certificate.issuedAt),
            ),
          )
          .where(
            and(
              inArray(s.studentCurriculum.personId, personIds),
              isNull(s.studentCurriculum.deletedAt),
              isNull(s.studentCompletedCompetency.deletedAt),
              isNull(s.certificate.deletedAt),
              input.filters.respectCertificateVisibility
                ? lte(s.certificate.visibleFrom, sql`now()`)
                : undefined,
            ),
          ),
      );

      const withModulesAgg = query.$with("modules_agg").as(
        query
          .select({
            personId: withModules.personId,
            studentCurriculumId: withModules.studentCurriculumId,
            modules: jsonAggBuildObject({
              moduleId: withModules.moduleId,
              certificateId: withModules.certificateId,
            }).as("modules"),
          })
          .from(withModules)
          .groupBy(withModules.personId, withModules.studentCurriculumId),
      );

      const withCertificates = query.$with("certificates").as(
        query
          .select({
            personId: s.studentCurriculum.personId,
            studentCurriculumId: s.studentCurriculum.id,
            certificateCount: countDistinct(s.certificate.id),
            certificates: jsonAggBuildObject(
              {
                id: s.certificate.id,
                handle: s.certificate.handle,
                issuedAt: sql<string>`${s.certificate.issuedAt}`,
                location: jsonBuildObject({
                  id: s.location.id,
                  handle: s.location.handle,
                  name: s.location.name,
                }),
              },
              {
                orderBy: {
                  colName: s.certificate.issuedAt,
                  direction: "ASC",
                },
              },
            ).as("certificates"),
          })
          .from(s.studentCurriculum)
          .innerJoin(
            s.certificate,
            and(
              eq(s.certificate.studentCurriculumId, s.studentCurriculum.id),
              isNotNull(s.certificate.issuedAt),
              input.filters.respectCertificateVisibility
                ? lte(s.certificate.visibleFrom, sql`now()`)
                : undefined,
              isNull(s.certificate.deletedAt),
            ),
          )
          .innerJoin(s.location, eq(s.location.id, s.certificate.locationId))
          .where(
            and(
              inArray(s.studentCurriculum.personId, personIds),
              isNull(s.studentCurriculum.deletedAt),
            ),
          )
          .groupBy(s.studentCurriculum.personId, s.studentCurriculum.id)
          .having(({ certificateCount }) =>
            input.filters.includeCurriculaWithoutProgress
              ? sql`TRUE`
              : sql`${certificateCount} > 0`,
          ),
      );

      const rows = await query
        .with(withModules, withModulesAgg, withCertificates)
        .select({
          personId: s.studentCurriculum.personId,
          studentCurriculumId: s.studentCurriculum.id,
          modules: withModulesAgg.modules,
          certificates: withCertificates.certificates,
        })
        .from(s.studentCurriculum)
        .leftJoin(
          withModulesAgg,
          eq(withModulesAgg.studentCurriculumId, s.studentCurriculum.id),
        )
        .leftJoin(
          withCertificates,
          eq(withCertificates.studentCurriculumId, s.studentCurriculum.id),
        )
        .where(
          and(
            inArray(s.studentCurriculum.personId, personIds),
            isNull(s.studentCurriculum.deletedAt),
          ),
        );

      return rows.map((row) => ({
        personId: row.personId,
        studentCurriculumId: row.studentCurriculumId,
        modules: row.modules || [],
        certificates: row.certificates || [],
      }));
    },
  ),
);
