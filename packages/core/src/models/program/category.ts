import { schema } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { useTransaction } from '../../util/transaction.js'
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
  (input) =>
    useTransaction(async (tx) => {
      const query = useQuery()
      const [insert] = await tx
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
    }),
)

export const list = zod(z.void(), async () =>
  useTransaction(async (tx) => {
    const query = useQuery()
    return tx.select().from(category)
  }),
)

export const fromId = zod(Info.shape.id, async (id) =>
  useTransaction(async (tx) => {
    const query = useQuery()
    return tx
      .select()
      .from(category)
      .where(eq(category.id, id))
      .then((rows) => rows[0])
  }),
)

export const fromHandle = zod(Info.shape.handle, async (handle) =>
  useTransaction(async (tx) => {
    const query = useQuery()
    return tx
      .select()
      .from(category)
      .where(eq(category.handle, handle))
      .then((rows) => rows[0])
  }),
)
