import { schema } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { zod } from '../../util/zod.js'

export * as Module from './module.js'

const moduleSchema = schema.module

export const Info = createSelectSchema(moduleSchema, {
  handle(schema) {
    return schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/)
  },
})
export type Info = typeof moduleSchema.$inferSelect

export const create = zod(
  Info.pick({ title: true, handle: true }).partial({
    title: true,
  }),
  async (input) => {
    const query = useQuery()
    const [insert] = await query
      .insert(moduleSchema)
      .values({
        handle: input.handle,
        title: input.title,
      })
      .returning({ id: moduleSchema.id })

    if (!insert) {
      throw new Error('Failed to insert module')
    }

    return insert.id
  },
)

export const list = zod(z.void(), async () => {
  const query = useQuery()
  return await query.select().from(moduleSchema)
})

export const fromId = zod(Info.shape.id, async (id) => {
  const query = useQuery()
  return await query
    .select()
    .from(moduleSchema)
    .where(eq(moduleSchema.id, id))
    .then((rows) => rows[0])
})

export const fromHandle = zod(Info.shape.handle, async (handle) => {
  const query = useQuery()
  return await query
    .select()
    .from(moduleSchema)
    .where(eq(moduleSchema.handle, handle))
    .then((rows) => rows[0])
})
