import { schema as s } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import {
  handleSchema,
  possibleSingleRow,
  singleRow,
  titleSchema,
  uuidSchema,
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

export const fromHandle = withZod(handleSchema, async (handle) => {
  const query = useQuery()

  const rows = await query
    .select({
      id: s.discipline.id,
      title: s.discipline.title,
      handle: s.discipline.handle,
    })
    .from(s.discipline)
    .where(eq(s.discipline.handle, handle))

  return possibleSingleRow(rows) ?? null
})

export const fromId = withZod(uuidSchema, async (id) => {
  const query = useQuery()

  const rows = await query
    .select({
      id: s.discipline.id,
      title: s.discipline.title,
      handle: s.discipline.handle,
    })
    .from(s.discipline)
    .where(eq(s.discipline.id, id))

  return possibleSingleRow(rows) ?? null
})
