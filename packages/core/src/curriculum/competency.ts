import { schema } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { useTransaction } from '../util/transaction.js'
import { zod } from '../util/zod.js'

export * as Competency from './competency.js'

const { curriculumCompetency } = schema

export const Info = createSelectSchema(curriculumCompetency, {
  id: (schema) => schema.id.uuid(),
  competencyId: (schema) => schema.competencyId.uuid(),
  curriculumId: (schema) => schema.curriculumId.uuid(),
  moduleId: (schema) => schema.moduleId.uuid(),
  requirement: (schema) => schema.requirement.trim(),
})
export type Info = typeof curriculumCompetency.$inferSelect

export const create = zod(
  Info.pick({
    curriculumId: true,
    moduleId: true,
    competencyId: true,
    isRequired: true,
    requirement: true,
  }).partial({
    requirement: true,
  }),
  (input) =>
    useTransaction(async (tx) => {
      const [insert] = await tx
        .insert(curriculumCompetency)
        .values({
          competencyId: input.competencyId,
          curriculumId: input.curriculumId,
          moduleId: input.moduleId,
          isRequired: input.isRequired,
          requirement: input.requirement,
        })
        .returning({ id: curriculumCompetency.id })

      if (!insert) {
        throw new Error('Failed to insert curriculumCompetency')
      }

      return insert.id
    }),
)

export const list = zod(z.void(), async () =>
  useTransaction(async (tx) => {
    return tx.select().from(curriculumCompetency)
  }),
)

export const fromId = zod(Info.shape.id, async (id) =>
  useTransaction(async (tx) => {
    return tx
      .select()
      .from(curriculumCompetency)
      .where(eq(curriculumCompetency.id, id))
      .then((rows) => rows[0])
  }),
)
