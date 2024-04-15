import { schema } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { zod } from '../../util/zod.js'

export * as Degree from './degree.js'

const degree = schema.degree

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
  async (input) => {
    const query = useQuery()
    const [insert] = await query
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
  },
)

export const list = zod(z.void(), async () => {
  const query = useQuery()
  return query.select().from(degree)
})

export const fromId = zod(Info.shape.id, async (id) => {
  const query = useQuery()
  return await query
    .select()
    .from(degree)
    .where(eq(degree.id, id))
    .then((rows) => rows[0])
})

export const fromHandle = zod(Info.shape.handle, async (handle) => {
  const query = useQuery()
  return await query
    .select()
    .from(degree)
    .where(eq(degree.handle, handle))
    .then((rows) => rows[0])
})
