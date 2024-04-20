import { schema as s } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import {
  handleSchema,
  singleRow,
  titleSchema,
  uuidSchema,
  withZod,
} from '../../util/index.js'

export const create = withZod(
  z.object({
    title: titleSchema,
    handle: handleSchema,
    parentCategoryId: uuidSchema.optional(),
    description: z.string().trim().optional(),
  }),
  async (item) => {
    const query = useQuery()

    const rows = await query
      .insert(s.category)
      .values({
        title: item.title,
        handle: item.handle,
        description: item.description,
        parentCategoryId: item.parentCategoryId,
      })
      .returning({ id: s.category.id })

    const row = singleRow(rows)
    return row
  },
)

export const list = withZod(z.void(), async () => {
  const query = useQuery()

  const rows = await query
    .select({
      id: s.category.id,
      title: s.category.title,
      handle: s.category.handle,
      description: s.category.description,
      parentCategoryId: s.category.parentCategoryId,
    })
    .from(s.category)

  return rows
})

export const fromHandle = withZod(handleSchema, async (handle) => {
  const query = useQuery()

  const self = alias(s.category, 'parent')

  const rows = await query
    .select()
    .from(s.category)
    .leftJoin(self, eq(s.category.id, self.id))
    .where(eq(s.category.handle, handle))

  const row = singleRow(rows)

  return {
    id: row.category.id,
    title: row.category.title,
    handle: row.category.handle,
    description: row.category.description,
    parent: row.parent
      ? {
          id: row.parent.id,
          title: row.parent.title,
          handle: row.parent.handle,
          description: row.parent.description,
        }
      : null,
  }
})
