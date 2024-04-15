import { schema } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { useTransaction } from '../../util/transaction.js'
import { zod } from '../../util/zod.js'

export * as Module from './module.js'

const module = schema.module

export const Info = createSelectSchema(module, {
  handle(schema) {
    return schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/)
  },
})
export type Info = typeof module.$inferSelect

export const create = zod(
  Info.pick({ title: true, handle: true }).partial({
    title: true,
  }),
  (input) =>
    useTransaction(async () => {
      const query = useQuery()
      const [insert] = await query
        .insert(module)
        .values({
          handle: input.handle,
          title: input.title,
        })
        .returning({ id: module.id })

      if (!insert) {
        throw new Error('Failed to insert module')
      }

      return insert.id
    }),
)

export const list = zod(z.void(), async () =>
  useTransaction(async () => {
    const query = useQuery()
    return query.select().from(module)
  }),
)

export const fromId = zod(Info.shape.id, async (id) =>
  useTransaction(async () => {
    const query = useQuery()
    return await query
      .select()
      .from(module)
      .where(eq(module.id, id))
      .then((rows) => rows[0])
  }),
)

export const fromHandle = zod(Info.shape.handle, async (handle) =>
  useTransaction(async () => {
    const query = useQuery()
    return await query
      .select()
      .from(module)
      .where(eq(module.handle, handle))
      .then((rows) => rows[0])
  }),
)
