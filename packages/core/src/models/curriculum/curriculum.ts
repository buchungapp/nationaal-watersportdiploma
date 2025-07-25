import assert from "node:assert";
import { schema as s } from "@nawadi/db";
import {
  type SQLWrapper,
  and,
  countDistinct,
  desc,
  eq,
  exists,
  inArray,
  isNotNull,
  isNull,
  lte,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import { findItem, singleRow } from "../../utils/data-helpers.js";
import dayjs from "../../utils/dayjs.js";
import { wrapCommand, wrapQuery } from "../../utils/index.js";
import {
  dateTimeSchema,
  singleOrArray,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from "../../utils/zod.js";
import { Module } from "../course/index.js";
import { Course } from "../index.js";
import { insertSchema, outputSchema } from "./curriculum.schema.js";

export * as Curriculum from "./curriculum.js";

export const create = wrapCommand(
  "curriculum.create",
  withZod(
    insertSchema.pick({
      programId: true,
      revision: true,
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const [insert] = await query
        .insert(s.curriculum)
        .values({
          programId: input.programId,
          revision: input.revision,
        })
        .returning({ id: s.curriculum.id });

      if (!insert) {
        throw new Error("Failed to insert curriculum");
      }

      return insert;
    },
  ),
);

export const list = wrapQuery(
  "curriculum.list",
  withZod(
    z
      .object({
        filter: z
          .object({
            id: singleOrArray(uuidSchema).optional(),
            programId: singleOrArray(uuidSchema).optional(),
            onlyCurrentActive: z.boolean().optional(),
            disciplineId: singleOrArray(uuidSchema).optional(),
            categoryId: singleOrArray(uuidSchema).optional(),
          })
          .default({}),
      })
      .default({}),
    outputSchema.array(),
    async ({ filter }) => {
      const query = useQuery();

      const filters: SQLWrapper[] = [];

      // Initialize the curricula query to fetch curriculum details along with joined module and competency data.
      let curriculaQuery = query
        .select()
        .from(s.curriculum)
        .leftJoin(
          s.curriculumModule,
          eq(s.curriculum.id, s.curriculumModule.curriculumId),
        )
        .leftJoin(
          s.curriculumCompetency,
          and(
            eq(s.curriculum.id, s.curriculumCompetency.curriculumId),
            eq(s.curriculumModule.moduleId, s.curriculumCompetency.moduleId),
          ),
        );

      if (filter.id) {
        if (Array.isArray(filter.id)) {
          filters.push(inArray(s.curriculum.id, filter.id));
        } else {
          filters.push(eq(s.curriculum.id, filter.id));
        }
      }

      // Filter for only current and active curricula if specified.
      if (filter.onlyCurrentActive) {
        // Subquery to get the latest curriculum per program.
        const latestCurriculumPerProgram = query
          .selectDistinctOn([s.curriculum.programId])
          .from(s.curriculum)
          .where(
            and(
              isNotNull(s.curriculum.startedAt),
              lte(s.curriculum.startedAt, new Date().toISOString()),
            ),
          )
          .orderBy(s.curriculum.programId, desc(s.curriculum.startedAt))
          .as("latestCurriculumPerProgram");

        // Join the main query with the latest curriculum per program.
        curriculaQuery = curriculaQuery.innerJoin(
          latestCurriculumPerProgram,
          eq(s.curriculum.id, latestCurriculumPerProgram.id),
        );
      }

      // Apply filtering based on program ID if provided.
      if (filter.programId) {
        if (Array.isArray(filter.programId)) {
          filters.push(inArray(s.curriculum.programId, filter.programId));
        } else {
          filters.push(eq(s.curriculum.programId, filter.programId));
        }
      }

      // Apply filtering based on discipline ID if provided.
      if (filter.disciplineId) {
        const sq = query
          .select({ id: sql`1` })
          .from(s.program)
          .innerJoin(s.course, eq(s.program.courseId, s.course.id))
          .where(
            Array.isArray(filter.disciplineId)
              ? inArray(s.course.disciplineId, filter.disciplineId)
              : eq(s.course.disciplineId, filter.disciplineId),
          );

        filters.push(exists(sq));
      }

      // Apply filtering based on category ID if provided.
      if (filter.categoryId) {
        const sq = query
          .select({ id: sql`1` })
          .from(s.program)
          .innerJoin(
            s.courseCategory,
            and(
              eq(s.courseCategory.courseId, s.program.courseId),
              Array.isArray(filter.categoryId)
                ? inArray(s.courseCategory.categoryId, filter.categoryId)
                : eq(s.courseCategory.categoryId, filter.categoryId),
            ),
          )
          .where(eq(s.curriculum.programId, s.program.id));

        filters.push(exists(sq));
      }

      // Fetch curricula, modules, and competencies data concurrently for efficiency.
      const [curricula, modules, competencies] = await Promise.all([
        curriculaQuery.where(and(...filters)),
        Module.list(),
        Course.Competency.list(),
      ]);

      const normalizedCurricula = Object.values(
        curricula.reduce<
          Record<
            string,
            (typeof curricula)[number]["curriculum"] & {
              modules: (NonNullable<
                (typeof curricula)[number]["curriculum_module"]
              > & {
                competencies: NonNullable<
                  (typeof curricula)[number]["curriculum_competency"]
                >[];
              })[];
            }
          >
        >((acc, { curriculum, curriculum_competency, curriculum_module }) => {
          const curriculumId = curriculum.id;

          if (!acc[curriculumId]) {
            acc[curriculumId] = {
              ...curriculum,
              modules: [],
            };
          }

          if (!curriculum_competency) {
            return acc;
          }

          assert(curriculum_module);

          if (
            !acc[curriculumId]?.modules.some(
              (module) =>
                module.curriculumId === curriculumId &&
                module.moduleId === curriculum_module.moduleId,
            )
          ) {
            acc[curriculumId]?.modules.push({
              ...curriculum_module,
              competencies: [],
            });
          }

          acc[curriculumId]?.modules
            .find(
              (module) =>
                module.curriculumId === curriculumId &&
                module.moduleId === curriculum_module.moduleId,
            )
            ?.competencies.push(curriculum_competency);

          return acc;
        }, {}),
      );

      // Map normalized data to the final structure with date formatting and module aggregation.
      const mapped = normalizedCurricula.map((curriculum) => {
        return {
          ...curriculum,
          startedAt: curriculum.startedAt
            ? dayjs(curriculum.startedAt).toISOString()
            : null,
          modules: curriculum.modules
            .map((curriculumModule) => {
              const module = findItem({
                items: modules,
                predicate(item) {
                  return item.id === curriculumModule.moduleId;
                },
                enforce: true,
              });

              const competenciesFormatted = curriculumModule.competencies
                .map(({ isRequired, requirement, competencyId, id }) => {
                  const competency = findItem({
                    items: competencies,
                    predicate: (item) => item.id === competencyId,
                    enforce: true,
                  });

                  return {
                    ...competency,
                    id,
                    competencyId,
                    isRequired,
                    requirement,
                  };
                })
                .sort((a, b) => a.weight - b.weight);

              return {
                ...module,
                competencies: competenciesFormatted,
                isRequired: competenciesFormatted.every((c) => c.isRequired),
                // As for now, a module can only have one type of competencies
                type: competenciesFormatted[0]?.type || null,
              };
            })
            .sort((a, b) => a.weight - b.weight),
        };
      });

      return mapped;
    },
  ),
);

export const getById = wrapQuery(
  "curriculum.getById",
  withZod(
    z.object({
      id: uuidSchema,
    }),
    outputSchema.nullable(),
    async ({ id }) => {
      const query = useQuery();

      // Initialize the curricula query to fetch curriculum details along with joined module and competency data.
      const curriculaQuery = query
        .select()
        .from(s.curriculum)
        .leftJoin(
          s.curriculumModule,
          eq(s.curriculum.id, s.curriculumModule.curriculumId),
        )
        .leftJoin(
          s.curriculumCompetency,
          and(
            eq(s.curriculum.id, s.curriculumCompetency.curriculumId),
            eq(s.curriculumModule.moduleId, s.curriculumCompetency.moduleId),
          ),
        )
        .where(eq(s.curriculum.id, id));

      // Fetch curricula, modules, and competencies data concurrently for efficiency.
      const [curricula, modules, competencies] = await Promise.all([
        curriculaQuery,
        Module.list(),
        Course.Competency.list(),
      ]);

      const normalizedCurriculum = curricula.reduce<
        | ((typeof curricula)[number]["curriculum"] & {
            modules: (NonNullable<
              (typeof curricula)[number]["curriculum_module"]
            > & {
              competencies: NonNullable<
                (typeof curricula)[number]["curriculum_competency"]
              >[];
            })[];
          })
        | null
      >((acc, { curriculum, curriculum_competency, curriculum_module }) => {
        let curriculaAcc = acc;
        if (!curriculaAcc) {
          curriculaAcc = { ...curriculum, modules: [] };
        }

        if (curriculum_module) {
          let module = curriculaAcc.modules.find(
            (m) => m.moduleId === curriculum_module.moduleId,
          );

          if (!module) {
            module = { ...curriculum_module, competencies: [] };
            curriculaAcc.modules.push(module);
          }

          if (curriculum_competency) {
            module.competencies.push(curriculum_competency);
          }
        }

        return curriculaAcc;
      }, null);

      if (!normalizedCurriculum) {
        return null;
      }

      // Map normalized data to the final structure with date formatting and module aggregation.
      const mapped = {
        ...normalizedCurriculum,
        startedAt: normalizedCurriculum.startedAt
          ? dayjs(normalizedCurriculum.startedAt).toISOString()
          : null,
        modules: normalizedCurriculum.modules
          .map((curriculumModule) => {
            const module = findItem({
              items: modules,
              predicate(item) {
                return item.id === curriculumModule.moduleId;
              },
              enforce: true,
            });

            const competenciesFormatted = curriculumModule.competencies
              .map(({ isRequired, requirement, competencyId, id }) => {
                const competency = findItem({
                  items: competencies,
                  predicate: (item) => item.id === competencyId,
                  enforce: true,
                });

                return {
                  ...competency,
                  id,
                  competencyId,
                  isRequired,
                  requirement,
                };
              })
              .sort((a, b) => a.weight - b.weight);

            return {
              ...module,
              competencies: competenciesFormatted,
              isRequired: competenciesFormatted.every((c) => c.isRequired),
              // As for now, a module can only have one type of competencies
              type: competenciesFormatted[0]?.type || null,
            };
          })
          .sort((a, b) => a.weight - b.weight),
      };

      return mapped;
    },
  ),
);

export const countStartedStudents = wrapQuery(
  "curriculum.countStartedStudents",
  withZod(
    z.object({
      curriculumId: uuidSchema,
    }),
    z.number(),
    async ({ curriculumId }) => {
      const query = useQuery();

      const count = await query
        .select({ count: countDistinct(s.studentCurriculum.personId) })
        .from(s.studentCurriculum)
        .where(eq(s.studentCurriculum.curriculumId, curriculumId))
        .then((rows) => rows[0]?.count ?? 0);

      return count;
    },
  ),
);

export const copy = wrapCommand(
  "curriculum.copy",
  withZod(
    z.object({
      curriculumId: uuidSchema,
      revision: z.string(),
    }),
    successfulCreateResponse,
    async ({ curriculumId, revision }) => {
      return withTransaction(async (tx) => {
        const curriculum = await tx
          .select({
            id: s.curriculum.id,
            programId: s.curriculum.programId,
          })
          .from(s.curriculum)
          .where(eq(s.curriculum.id, curriculumId))
          .then(singleRow);

        // Insert a new curriculum with the same program ID.
        const { id: newCurriculum } = await tx
          .insert(s.curriculum)
          .values({
            programId: curriculum.programId,
            revision,
            startedAt: null,
          })
          .returning({ id: s.curriculum.id })
          .then(singleRow);

        // Copy modules, competencies and gear types from the old curriculum to the new one.
        const [oldModules, oldCompetencies, oldGearTypes] = await Promise.all([
          tx
            .select()
            .from(s.curriculumModule)
            .where(eq(s.curriculumModule.curriculumId, curriculumId)),
          tx
            .select()
            .from(s.curriculumCompetency)
            .where(eq(s.curriculumCompetency.curriculumId, curriculumId)),
          tx
            .select()
            .from(s.curriculumGearLink)
            .where(eq(s.curriculumGearLink.curriculumId, curriculumId)),
        ]);

        // Insert modules
        await tx.insert(s.curriculumModule).values(
          oldModules.map((module) => ({
            curriculumId: newCurriculum,
            moduleId: module.moduleId,
          })),
        );

        // Insert competencies
        await tx.insert(s.curriculumCompetency).values(
          oldCompetencies.map((competency) => ({
            curriculumId: newCurriculum,
            moduleId: competency.moduleId,
            competencyId: competency.competencyId,
            isRequired: competency.isRequired,
            requirement: competency.requirement,
          })),
        );

        // Insert gear types
        await tx.insert(s.curriculumGearLink).values(
          oldGearTypes.map((gearType) => ({
            curriculumId: newCurriculum,
            gearTypeId: gearType.gearTypeId,
          })),
        );

        return { id: newCurriculum };
      });
    },
  ),
);

export const start = wrapCommand(
  "curriculum.start",
  withZod(
    z.object({
      curriculumId: uuidSchema,
      startedAt: dateTimeSchema.optional(),
    }),
    successfulCreateResponse,
    async ({ curriculumId, startedAt }) => {
      const query = useQuery();
      const curriculum = await query
        .update(s.curriculum)
        .set({ startedAt: startedAt ?? sql`NOW()` })
        .where(
          // @TODO: Check if curriculum contains at least one valid module
          and(
            eq(s.curriculum.id, curriculumId),
            isNull(s.curriculum.startedAt),
          ),
        )
        .returning({ id: s.curriculum.id })
        .then(singleRow);

      return { id: curriculum.id };
    },
  ),
);

export const linkModule = wrapCommand(
  "curriculum.linkModule",
  withZod(
    z.object({
      curriculumId: uuidSchema,
      moduleId: uuidSchema,
    }),
    async ({ curriculumId, moduleId }) => {
      const query = useQuery();
      await query
        .insert(s.curriculumModule)
        .values({
          moduleId,
          curriculumId,
        })
        .onConflictDoNothing();

      return {
        curriculumId,
        moduleId,
      };
    },
  ),
);
