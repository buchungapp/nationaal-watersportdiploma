import { schema as s } from '@nawadi/db'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery, withTransaction } from '../../contexts/index.js'
import {
  handleSchema,
  possibleSingleRow,
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
  async (item) =>
    withTransaction(async (tx) => {
      const currentHeighestWeight = await tx
        .select({ weight: s.competency.weight })
        .from(s.competency)
        .orderBy(desc(s.competency.weight))
        .limit(1)
        .then((rows) => rows[0]?.weight ?? 0)

      const rows = await tx
        .insert(s.competency)
        .values({
          title: item.title,
          handle: item.handle,
          type: item.type,
          weight: currentHeighestWeight + 1,
        })
        .returning({ id: s.competency.id })

      const row = singleRow(rows)
      return row
    }),
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

  return possibleSingleRow(rows) ?? null
})
