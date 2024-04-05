import { schema } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { useTransaction } from '../util/transaction'
import { zod } from '../util/zod'

export * as Program from './'
export { Competency } from './competency'
export { Degree } from './degree'
export { Discipline } from './discipline'
export { Module } from './module'

const program = schema.program

export const Info = createSelectSchema(program, {
  handle(schema) {
    return schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/)
  },
  disciplineId: (schema) => schema.disciplineId.uuid(),
  degreeId: (schema) => schema.degreeId.uuid(),
})
export type Info = typeof program.$inferSelect

export const create = zod(
  Info.pick({
    title: true,
    handle: true,
    disciplineId: true,
    degreeId: true,
  }).partial({
    title: true,
  }),
  (input) =>
    useTransaction(async (tx) => {
      const [insert] = await tx
        .insert(program)
        .values({
          handle: input.handle,
          title: input.title,
          disciplineId: input.disciplineId,
          degreeId: input.degreeId,
        })
        .returning({ id: program.id })

      if (!insert) {
        throw new Error('Failed to insert program')
      }

      return insert.id
    }),
)

export const list = zod(z.void(), async () =>
  useTransaction(async (tx) => {
    return tx.select().from(program)
  }),
)

export const fromId = zod(Info.shape.id, async (id) =>
  useTransaction(async (tx) => {
    return tx
      .select()
      .from(program)
      .where(eq(program.id, id))
      .then((rows) => rows[0])
  }),
)

export const fromHandle = zod(Info.shape.handle, async (handle) =>
  useTransaction(async (tx) => {
    return tx
      .select()
      .from(program)
      .where(eq(program.handle, handle))
      .then((rows) => rows[0])
  }),
)
