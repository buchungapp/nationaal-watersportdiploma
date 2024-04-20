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
      id: s.degree.id,
      title: s.degree.title,
      handle: s.degree.handle,
      rang: s.degree.rang,
    })
    .from(s.degree)

  return rows
})

export const create = withZod(
  z.object({
    title: titleSchema,
    handle: handleSchema,
    rang: z.number().int(),
  }),
  async (item) => {
    const query = useQuery()

    const rows = await query
      .insert(s.degree)
      .values({
        title: item.title,
        handle: item.handle,
        rang: item.rang,
      })
      .returning({ id: s.degree.id })

    const row = singleRow(rows)
    return row
  },
)
