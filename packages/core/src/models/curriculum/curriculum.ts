import { schema as s } from '@nawadi/db'
import { and, desc, eq, inArray, isNotNull, lte } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { aggregateOneToMany, findItem } from '../../util/data-helpers.js'
import dayjs from '../../util/dayjs.js'
import {
  dateTimeSchema,
  singleOrArray,
  uuidSchema,
  withZod,
} from '../../util/zod.js'
import { Program } from '../index.js'
import { Module } from '../program/index.js'

export * as Curriculum from './curriculum.js'

export const create = withZod(
  z.object({
    programId: uuidSchema,
    revision: z.string(),
    startedAt: dateTimeSchema.optional(),
  }),
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
  async ({ filter }) => {
    const query = useQuery()

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

    if (filter.onlyCurrentActive) {
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

      curriculaQuery = curriculaQuery.innerJoin(
        latestCurriculumPerProgram,
        eq(s.curriculum.id, latestCurriculumPerProgram.id),
      )
    }

    if (filter.programId) {
      if (Array.isArray(filter.programId)) {
        curriculaQuery = curriculaQuery.where(
          inArray(s.curriculum.programId, filter.programId),
        )
      } else {
        curriculaQuery = curriculaQuery.where(
          eq(s.curriculum.programId, filter.programId),
        )
      }
    }

    const [curricula, modules, competencies] = await Promise.all([
      curriculaQuery,
      Module.list(),
      Program.Competency.list(),
    ])

    const curriculumWithModules = aggregateOneToMany(
      curricula,
      'curriculum',
      'curriculum_module',
    )
    const modulesWithCompetencies = aggregateOneToMany(
      curricula,
      'curriculum_module',
      'curriculum_competency',
    )

    const mapped = curriculumWithModules.map(
      ({ curriculum_module, programId, ...curriculum }) => {
        const moduleLinks = modulesWithCompetencies.filter(
          (module) => module.curriculumId === curriculum.id,
        )

        return {
          ...curriculum,
          startedAt: curriculum.startedAt
            ? dayjs(curriculum.startedAt).toISOString()
            : null,
          programId,
          modules: moduleLinks
            .map(({ curriculum_competency, moduleId }) => {
              const module = findItem({
                items: modules,
                predicate(item) {
                  return item.id === moduleId
                },
                enforce: true,
              })

              return {
                ...module,
                competencies: curriculum_competency.map(
                  ({ id, isRequired, requirement, competencyId }) => {
                    const competency = findItem({
                      items: competencies,
                      predicate(item) {
                        return item.id === competencyId
                      },
                      enforce: true,
                    })

                    return {
                      id: competency.id,
                      handle: competency.handle,
                      title: competency.title,
                      type: competency.type,
                      isRequired,
                      requirement,
                    }
                  },
                ),
              }
            })
            // As for now, a module can only have one type of competencies
            .map((item) => {
              return {
                ...item,
                isRequired: item.competencies.every(
                  (competency) => competency.isRequired,
                ),
                type:
                  item.competencies.length > 0
                    ? item.competencies[0]!.type
                    : null,
              }
            }),
        }
      },
    )

    return mapped
  },
)

// export const fromProgramId = withZod(
//   Info.pick({
//     programId: true,
//     revision: true,
//   }).partial({ revision: true }),
//   async ({ programId, revision }) => {
//     const query = useQuery()
//     const whereClausules: SQL[] = [eq(curriculum.programId, programId)]

//     if (revision) {
//       whereClausules.push(eq(curriculum.revision, revision))
//     } else {
//       whereClausules.push(isNotNull(curriculum.startedAt))
//     }

//     return await query
//       .select()
//       .from(curriculum)
//       .where(and(...whereClausules))
//       .orderBy(desc(curriculum.startedAt))
//       .limit(1)
//       .then((rows) => rows[0])
//   },
// )

export const linkModule = withZod(
  z.object({
    curriculumId: uuidSchema,
    moduleId: uuidSchema,
  }),
  async ({ curriculumId, moduleId }) => {
    const query = useQuery()
    await query.insert(s.curriculumModule).values({
      moduleId,
      curriculumId,
    })

    return {
      curriculumId,
      moduleId,
    }
  },
)
