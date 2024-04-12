import { schema } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { useTransaction } from '../util/transaction'
import { zod } from '../util/zod'

export * as Degree from './degree'

const degree = schema.degree

export const test = 1

export const Info = createSelectSchema(degree, {
  handle(schema) {
    return schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/)
  },
  rang(schema) {
    return schema.rang.int()
  },
})
export type Info = typeof degree.$inferSelect

export const create = zod(
  Info.pick({ title: true, handle: true, rang: true }).partial({
    title: true,
  }),
  (input) =>
    useTransaction(async (tx) => {
      const [insert] = await tx
        .insert(degree)
        .values({
          handle: input.handle,
          title: input.title,
          rang: input.rang,
        })
        .returning({ id: degree.id })

      if (!insert) {
        throw new Error('Failed to insert degree')
      }

      return insert.id
    }),
)

export const list = zod(z.void(), async () =>
  useTransaction(async (tx) => {
    return tx.select().from(degree)
  }),
)

export const fromId = zod(Info.shape.id, async (id) =>
  useTransaction(async (tx) => {
    return tx
      .select()
      .from(degree)
      .where(eq(degree.id, id))
      .then((rows) => rows[0])
  }),
)

export const fromHandle = zod(Info.shape.handle, async (handle) =>
  useTransaction(async (tx) => {
    return tx
      .select()
      .from(degree)
      .where(eq(degree.handle, handle))
      .then((rows) => rows[0])
  }),
)
