import { schema as s } from '@nawadi/db'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import {
  handleSchema,
  singleRow,
  titleSchema,
  withZod,
} from '../../util/index.js'

export const list = withZod(z.void(), async () => {
  const query = useQuery()

  const rows = await query
    .select({
      id: s.module.id,
      title: s.module.title,
      handle: s.module.handle,
    })
    .from(s.module)

  return rows
})

export const create = withZod(
  z.object({
    title: titleSchema,
    handle: handleSchema,
  }),
  async (item) => {
    const query = useQuery()

    const rows = await query
      .insert(s.module)
      .values({
        title: item.title,
        handle: item.handle,
      })
      .returning({ id: s.module.id })

    const row = singleRow(rows)
    return row
  },
)
