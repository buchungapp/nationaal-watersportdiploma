import { schema as s } from '@nawadi/db'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import {
  handleSchema,
  singleRow,
  titleSchema,
  uuidSchema,
  withZod,
} from '../../util/index.js'

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
