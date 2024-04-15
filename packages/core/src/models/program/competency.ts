import { schema } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { useTransaction } from '../../util/transaction.js'
import { zod } from '../../util/zod.js'

export * as Competency from './competency.js'

export const Info = createSelectSchema(schema.competency, {
  handle(schema) {
    return schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/)
  },
})
export type Info = typeof schema.competency.$inferSelect

export const create = zod(
  Info.pick({ title: true, type: true, handle: true }).partial({
    title: true,
  }),
  (input) =>
    useTransaction(async (tx) => {
      const [insert] = await tx
        .insert(schema.competency)
        .values({
          handle: input.handle,
          type: input.type,
          title: input.title,
        })
        .returning({ id: schema.competency.id })

      if (!insert) {
        throw new Error('Failed to insert competency')
      }

      return insert.id
    }),
)

export const list = zod(z.void(), async () =>
  useTransaction(async (tx) => {
    return tx.select().from(schema.competency)
  }),
)

export const fromId = zod(Info.shape.id, async (id) =>
  useTransaction(async (tx) => {
    return tx
      .select()
      .from(schema.competency)
      .where(eq(schema.competency.id, id))
      .then((rows) => rows[0])
  }),
)

export const fromHandle = zod(Info.shape.handle, async (handle) =>
  useTransaction(async (tx) => {
    return tx
      .select()
      .from(schema.competency)
      .where(eq(schema.competency.handle, handle))
      .then((rows) => rows[0])
  }),
)
