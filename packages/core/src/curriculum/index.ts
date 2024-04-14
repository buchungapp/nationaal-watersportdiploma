import { schema } from '@nawadi/db'
import { SQL, and, asc, desc, eq, isNotNull } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { Module } from '../program/module.js'
import { ProgramSchema } from '../schemas/program.js'
import { createTransaction, useTransaction } from '../util/transaction.js'
import { zod } from '../util/zod.js'

export { Competency } from './competency.js'
export * as Curriculum from './index.js'

const curriculum = schema.curriculum

export const Info = createSelectSchema(curriculum, {
  id: (schema) => schema.id.uuid(),
  programId: (schema) => schema.programId.uuid(),
  startedAt: (schema) => schema.startedAt.datetime(),
})
export type Info = typeof curriculum.$inferSelect

export const create = zod(
  Info.pick({
    programId: true,
    revision: true,
    startedAt: true,
  }).partial({
    startedAt: true,
  }),
  (input) =>
    createTransaction(async (tx) => {
      const [insert] = await tx
        .insert(curriculum)
        .values({
          programId: input.programId,
          revision: input.revision,
          startedAt: input.startedAt,
        })
        .returning({ id: curriculum.id })

      if (!insert) {
        throw new Error('Failed to insert curriculum')
      }

      return insert.id
    }),
)

export const list = zod(z.void(), async () =>
  useTransaction(async (tx) => {
    const parentCategory = alias(schema.category, 'parent')
    const _programCategories = tx
      .select()
      .from(schema.program)
      .innerJoin(
        schema.programCategory,
        eq(schema.program.id, schema.programCategory.programId),
      )
      .innerJoin(
        schema.category,
        eq(schema.programCategory.categoryId, schema.category.id),
      )
      .leftJoin(
        parentCategory,
        eq(parentCategory.id, schema.category.parentCategoryId),
      )

    const latestCurriculumPerProgram = tx
      .selectDistinctOn([curriculum.programId])
      .from(curriculum)
      .where(isNotNull(curriculum.startedAt))
      .orderBy(curriculum.programId, desc(curriculum.startedAt))
      .as('latestCurriculumPerProgram')

    const _data = tx
      .select()
      .from(curriculum)
      .innerJoin(
        latestCurriculumPerProgram,
        eq(curriculum.id, latestCurriculumPerProgram.id),
      )
      .innerJoin(schema.program, eq(curriculum.programId, schema.program.id))
      .innerJoin(schema.degree, eq(schema.program.degreeId, schema.degree.id))
      .innerJoin(
        schema.curriculumModule,
        eq(curriculum.id, schema.curriculumModule.curriculumId),
      )
      .innerJoin(
        schema.discipline,
        eq(schema.program.disciplineId, schema.discipline.id),
      )
      .innerJoin(
        schema.curriculumCompetency,
        and(
          eq(curriculum.id, schema.curriculumCompetency.curriculumId),
          eq(
            schema.curriculumModule.moduleId,
            schema.curriculumCompetency.moduleId,
          ),
        ),
      )
      .innerJoin(
        schema.module,
        eq(schema.module.id, schema.curriculumModule.moduleId),
      )
      .innerJoin(
        schema.competency,
        eq(schema.competency.id, schema.curriculumCompetency.competencyId),
      )
      .orderBy(
        schema.program.disciplineId,
        asc(schema.degree.rang),
        curriculum.programId,
        asc(schema.module.title),
        asc(schema.competency.title),
      )

    const [programCategories, data] = await Promise.all([
      _programCategories,
      _data,
    ])

    const perProgramPerModule = data.reduce((acc, row) => {
      const programId = row.program.id

      if (!acc.has(programId)) {
        const categoriesForProgram = programCategories
          .filter((category) => category.program.id === programId)
          .map(({ category, parent }) => ({
            id: category.id,
            handle: category.handle,
            title: category.title,
            description: category.description,
            parent: parent,
          }))

        acc.set(programId, {
          id: row.program.id,
          handle: row.program.handle,
          title: row.program.title,
          curriculum: {
            revision: row.curriculum.revision,
            startedAt: row.curriculum.startedAt,
          },
          discipline: row.discipline,
          degree: row.degree,
          categories: categoriesForProgram,
          modules: [],
        })
      }

      const program = acc.get(programId)!

      const moduleId = row.curriculum_module.moduleId

      if (!program.modules.some((module) => module.id === moduleId)) {
        program.modules.push({
          id: moduleId,
          handle: row.module.handle,
          title: row.module.title,
          isRequired: row.curriculum_competency.isRequired,
          type: row.competency.type,
          competencies: [],
        })
      }

      const module = program.modules.find((module) => module.id === moduleId)!

      module.competencies.push({
        handle: row.competency.handle,
        title: row.competency.title,
        type: row.competency.type,
        requirement: row.curriculum_competency.requirement,
      })

      return acc
    }, new Map<string, z.infer<typeof ProgramSchema>>())

    // Convert map to array
    return Array.from(perProgramPerModule.values())
  }),
)

export const fromProgramId = zod(
  Info.pick({
    programId: true,
    revision: true,
  }).partial({ revision: true }),
  async ({ programId, revision }) =>
    useTransaction(async (tx) => {
      const whereClausules: SQL[] = [eq(curriculum.programId, programId)]

      if (revision) {
        whereClausules.push(eq(curriculum.revision, revision))
      } else {
        whereClausules.push(isNotNull(curriculum.startedAt))
      }

      return tx
        .select()
        .from(curriculum)
        .where(and(...whereClausules))
        .orderBy(desc(curriculum.startedAt))
        .limit(1)
        .then((rows) => rows[0])
    }),
)

export const linkModule = zod(
  z.object({
    curriculumId: Info.shape.id,
    moduleId: Module.Info.shape.id,
  }),
  async ({ curriculumId, moduleId }) =>
    useTransaction(async (tx) => {
      await tx.insert(schema.curriculumModule).values({
        moduleId,
        curriculumId,
      })

      return {
        curriculumId,
        moduleId,
      }
    }),
)
