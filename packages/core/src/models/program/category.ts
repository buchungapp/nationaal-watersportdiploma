import { schema } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { zod } from '../../util/zod.js'

export * as Category from './category.js'

const category = schema.category

export const test = 1

export const Info = createSelectSchema(category, {
  handle(schema) {
    return schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/)
  },
  parentCategoryId: (schema) => schema.parentCategoryId.uuid(),
})
export type Info = typeof category.$inferSelect

export const create = zod(
  Info.pick({
    title: true,
    handle: true,
    parentCategoryId: true,
    description: true,
  }).partial({
    title: true,
    parentCategoryId: true,
    description: true,
  }),
  async (input) => {
    const query = useQuery()
    const [insert] = await query
      .insert(category)
      .values({
        handle: input.handle,
        title: input.title,
        parentCategoryId: input.parentCategoryId,
        description: input.description,
      })
      .returning({ id: category.id })

    if (!insert) {
      throw new Error('Failed to insert category')
    }

    return insert.id
  },
)

export const list = zod(z.void(), async () => {
  const query = useQuery()
  return query.select().from(category)
})

export const fromId = zod(Info.shape.id, async (id) => {
  const query = useQuery()
  return await query
    .select()
    .from(category)
    .where(eq(category.id, id))
    .then((rows) => rows[0])
})

export const fromHandle = zod(Info.shape.handle, async (handle) => {
  const query = useQuery()
  return await query
    .select()
    .from(category)
    .where(eq(category.handle, handle))
    .then((rows) => rows[0])
})
