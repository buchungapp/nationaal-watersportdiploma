import { schema as s } from '@nawadi/db'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery, withTransaction } from '../../contexts/index.js'
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
  async (item) =>
    withTransaction(async (tx) => {
      const currentHeighestWeight = await tx
        .select({ weight: s.discipline.weight })
        .from(s.discipline)
        .orderBy(desc(s.discipline.weight))
        .limit(1)
        .then((rows) => rows[0]?.weight ?? 0)

      const rows = await tx
        .insert(s.discipline)
        .values({
          title: item.title,
          handle: item.handle,
          weight: currentHeighestWeight + 1,
        })
        .returning({ id: s.discipline.id })

      const row = singleRow(rows)
      return row
    }),
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
