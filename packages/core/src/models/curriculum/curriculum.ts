import { schema as s } from '@nawadi/db'
import { and, desc, eq, inArray, isNotNull, lte } from 'drizzle-orm'
import assert from 'node:assert'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { findItem } from '../../util/data-helpers.js'
import dayjs from '../../util/dayjs.js'
import {
  singleOrArray,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from '../../util/zod.js'
import { Program } from '../index.js'
import { Module } from '../program/index.js'
import { insertSchema, outputSchema } from './curriculum.schema.js'

export * as Curriculum from './curriculum.js'

export const create = withZod(
  insertSchema.pick({
    programId: true,
    revision: true,
    startedAt: true,
  }),
  successfulCreateResponse,
  async (input) => {
    const query = useQuery()

    const [insert] = await query
      .insert(s.curriculum)
      .values({
        programId: input.programId,
        revision: input.revision,
        startedAt: input.startedAt,
      })
      .returning({ id: s.curriculum.id })

    if (!insert) {
      throw new Error('Failed to insert curriculum')
    }

    return insert
  },
)

export const list = withZod(
  z
    .object({
      filter: z
        .object({
          programId: singleOrArray(uuidSchema).optional(),
          onlyCurrentActive: z.boolean().optional(),
        })
        .default({}),
    })
    .default({}),
  outputSchema.array(),
  async ({ filter }) => {
    const query = useQuery()

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
      )
      .$dynamic()

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
        .as('latestCurriculumPerProgram')

      // Join the main query with the latest curriculum per program.
      curriculaQuery = curriculaQuery.innerJoin(
        latestCurriculumPerProgram,
        eq(s.curriculum.id, latestCurriculumPerProgram.id),
      )
    }

    // Apply filtering based on program ID if provided.
    if (filter.programId) {
      curriculaQuery = Array.isArray(filter.programId)
        ? curriculaQuery.where(
            inArray(s.curriculum.programId, filter.programId),
          )
        : curriculaQuery.where(eq(s.curriculum.programId, filter.programId))
    }

    // Fetch curricula, modules, and competencies data concurrently for efficiency.
    const [curricula, modules, competencies] = await Promise.all([
      curriculaQuery,
      Module.list(),
      Program.Competency.list(),
    ])

    const normalizedCurricula = Object.values(
      curricula.reduce<
        Record<
          string,
          (typeof curricula)[number]['curriculum'] & {
            modules: (NonNullable<
              (typeof curricula)[number]['curriculum_module']
            > & {
              competencies: NonNullable<
                (typeof curricula)[number]['curriculum_competency']
              >[]
            })[]
          }
        >
      >((acc, { curriculum, curriculum_competency, curriculum_module }) => {
        const curriculumId = curriculum.id

        if (!acc[curriculumId]) {
          acc[curriculumId] = {
            ...curriculum,
            modules: [],
          }
        }

        if (!curriculum_competency) {
          return acc
        }

        assert(curriculum_module)

        if (
          !acc[curriculumId]!.modules.some(
            (module) =>
              module.curriculumId === curriculumId &&
              module.moduleId === curriculum_module.moduleId,
          )
        ) {
          acc[curriculumId]!.modules.push({
            ...curriculum_module,
            competencies: [],
          })
        }

        acc[curriculumId]!.modules.find(
          (module) =>
            module.curriculumId === curriculumId &&
            module.moduleId === curriculum_module.moduleId,
        )!.competencies.push(curriculum_competency)

        return acc
      }, {}),
    )

    // Map normalized data to the final structure with date formatting and module aggregation.
    const mapped = normalizedCurricula.map((curriculum) => {
      return {
        ...curriculum,
        startedAt: curriculum.startedAt
          ? dayjs(curriculum.startedAt).toISOString()
          : null,
        modules: curriculum.modules.map((curriculumModule) => {
          const module = findItem({
            items: modules,
            predicate(item) {
              return item.id === curriculumModule.moduleId
            },
            enforce: true,
          })

          const competenciesFormatted = curriculumModule.competencies.map(
            ({ isRequired, requirement, competencyId }) => {
              const competency = findItem({
                items: competencies,
                predicate: (item) => item.id === competencyId,
                enforce: true,
              })

              return {
                ...competency,
                isRequired,
                requirement,
              }
            },
          )

          return {
            ...module,
            competencies: competenciesFormatted,
            isRequired: competenciesFormatted.every((c) => c.isRequired),
            // As for now, a module can only have one type of competencies
            type: competenciesFormatted[0]?.type || null,
          }
        }),
      }
    })

    return mapped
  },
)

export const linkModule = withZod(
  z.object({
    curriculumId: uuidSchema,
    moduleId: uuidSchema,
  }),
  async ({ curriculumId, moduleId }) => {
    const query = useQuery()
    await query
      .insert(s.curriculumModule)
      .values({
        moduleId,
        curriculumId,
      })
      .onConflictDoNothing()

    return {
      curriculumId,
      moduleId,
    }
  },
)