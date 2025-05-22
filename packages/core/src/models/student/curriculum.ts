import { schema as s } from "@nawadi/db";
import { and, eq, exists, isNotNull, isNull, min, sql } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  aliasedColumn,
  jsonAggBuildObject,
  jsonBuildObject,
  possibleSingleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import { insertSchema } from "./curriculum.schema.js";

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

export const listProgramProgresses = wrapQuery(
  "student.curriculum.listProgramProgresses",
  withZod(
    z.object({
      personId: uuidSchema,
    }),
    async (input) => {
      const query = useQuery();

      const withModuleCompetencies = query.$with("module_competencies").as(
        query
          .select({
            moduleId: aliasedColumn(s.module.id, "moduleId"),
            moduleHandle: aliasedColumn(s.module.handle, "moduleHandle"),
            moduleTitle: aliasedColumn(s.module.title, "moduleTitle"),
            moduleWeight: aliasedColumn(s.module.weight, "moduleWeight"),
            curriculumId: aliasedColumn(s.curriculum.id, "curriculumId"),
            curriculumRevision: aliasedColumn(
              s.curriculum.revision,
              "curriculumRevision",
            ),
            competencies: jsonAggBuildObject(
              {
                id: s.competency.id,
                handle: s.competency.handle,
                title: s.competency.title,
                weight: s.competency.weight,
                type: s.competency.type,
                completed: sql<null | {
                  createdAt: Date;
                }>`CASE WHEN ${s.studentCompletedCompetency.createdAt} IS NOT NULL THEN ${jsonBuildObject(
                  {
                    createdAt: s.studentCompletedCompetency.createdAt,
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
          .groupBy(s.module.id, s.curriculum.id),
      );

      const curriculumRows = query
        .with(withModuleCompetencies)
        .select({
          startedAt: min(s.studentCurriculum.startedAt),
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
              curriculum: jsonBuildObject({
                id: withModuleCompetencies.curriculumId,
                revision: withModuleCompetencies.curriculumRevision,
              }),
              module: jsonBuildObject({
                id: withModuleCompetencies.moduleId,
                handle: withModuleCompetencies.moduleHandle,
                title: withModuleCompetencies.moduleTitle,
                weight: withModuleCompetencies.moduleWeight,
              }),
              competencies: withModuleCompetencies.competencies,
            },
            {
              // @ts-expect-error - The module weight doesn't have the column type because of the aliased column
              orderBy: {
                colName: withModuleCompetencies.moduleWeight,
                direction: "ASC",
              },
            },
          ).as("modules"),
        })
        .from(s.studentCurriculum)
        .innerJoin(
          s.curriculum,
          eq(s.studentCurriculum.curriculumId, s.curriculum.id),
        )
        .innerJoin(s.program, eq(s.curriculum.programId, s.program.id))
        .innerJoin(s.degree, eq(s.program.degreeId, s.degree.id))
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
            eq(s.studentCurriculum.personId, input.personId),
            isNull(s.studentCurriculum.deletedAt),
          ),
        )
        .groupBy(s.gearType.id, s.program.id, s.degree.id);

      const rows = await curriculumRows;
      // console.log(rows[0]!.modules[0]!.module.weight);

      return rows;
    },
  ),
);
