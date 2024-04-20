import { schema as s } from '@nawadi/db'
import { eq } from 'drizzle-orm'
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
      id: s.competency.id,
      title: s.competency.title,
      handle: s.competency.handle,
      type: s.competency.type,
    })
    .from(s.competency)

  return rows
})

export const create = withZod(
  z.object({
    title: titleSchema,
    handle: handleSchema,
    type: z.enum(['knowledge', 'skill']),
  }),
  async (item) => {
    const query = useQuery()

    const rows = await query
      .insert(s.competency)
      .values({
        title: item.title,
        handle: item.handle,
        type: item.type,
      })
      .returning({ id: s.competency.id })

    const row = singleRow(rows)
    return row
  },
)

export const fromHandle = withZod(handleSchema, async (handle) => {
  const query = useQuery()

  const rows = await query
    .select({
      id: s.competency.id,
      title: s.competency.title,
      handle: s.competency.handle,
      type: s.competency.type,
    })
    .from(s.competency)
    .where(eq(s.competency.handle, handle))

  return singleRow(rows)
})
