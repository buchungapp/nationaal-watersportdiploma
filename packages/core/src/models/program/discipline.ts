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
      id: s.discipline.id,
      title: s.discipline.title,
      handle: s.discipline.handle,
    })
    .from(s.discipline)

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
      .insert(s.discipline)
      .values({
        title: item.title,
        handle: item.handle,
      })
      .returning({ id: s.discipline.id })

    const row = singleRow(rows)
    return row
  },
)
