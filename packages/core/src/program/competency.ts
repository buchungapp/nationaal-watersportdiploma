import { schema } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { useTransaction } from '../util/transaction'
import { zod } from '../util/zod'

export const Info = createSelectSchema(schema.competency, {})
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
    return tx
      .select()
      .from(schema.competency)
      .then((rows) => rows[0])
  }),
)

export const fromID = zod(Info.shape.id, async (id) =>
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
