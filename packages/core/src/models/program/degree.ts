import { schema as s } from '@nawadi/db'
import { eq } from 'drizzle-orm'
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

export const fromHandle = withZod(handleSchema, async (handle) => {
  const query = useQuery()

  const rows = await query
    .select({
      id: s.degree.id,
      title: s.degree.title,
      handle: s.degree.handle,
      rang: s.degree.rang,
    })
    .from(s.degree)
    .where(eq(s.degree.handle, handle))

  return singleRow(rows)
})

export const fromId = withZod(uuidSchema, async (id) => {
  const query = useQuery()

  const rows = await query
    .select({
      id: s.degree.id,
      title: s.degree.title,
      handle: s.degree.handle,
      rang: s.degree.rang,
    })
    .from(s.degree)
    .where(eq(s.degree.id, id))

  return singleRow(rows)
})
