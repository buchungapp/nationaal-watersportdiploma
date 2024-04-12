import { schema } from '@nawadi/db'
import { SQL, and, desc, eq, isNotNull } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { Module } from '../program/module.js'
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
    return tx.select().from(curriculum)
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
