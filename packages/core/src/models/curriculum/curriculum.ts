import { schema as s } from '@nawadi/db'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { aggregateOneToMany, findItem } from '../../util/data-helpers.js'
import { dateTimeSchema, uuidSchema, withZod } from '../../util/zod.js'
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

export const list = withZod(z.void(), async () => {
  const query = useQuery()

  //   const latestCurriculumPerProgram = query
  //     .selectDistinctOn([s.curriculum.programId])
  //     .from(s.curriculum)
  //     .where(isNotNull(s.curriculum.startedAt))
  //     .orderBy(s.curriculum.programId, desc(s.curriculum.startedAt))
  //     .as('latestCurriculumPerProgram')

  //   .innerJoin(
  //     latestCurriculumPerProgram,
  //     eq(s.curriculum.id, latestCurriculumPerProgram.id),
  //   )

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
        programId,
        modules: moduleLinks.map(({ curriculum_competency, moduleId }) => {
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
              ({ id, isRequired, requirement }) => {
                const competency = findItem({
                  items: competencies,
                  predicate(item) {
                    return item.id === id
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
        }),
      }
    },
  )

  return mapped
})

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
