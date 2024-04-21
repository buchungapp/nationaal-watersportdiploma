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
  async (item) =>
    withTransaction(async (tx) => {
      const currentHeighestWeight = await tx
        .select({ weight: s.module.weight })
        .from(s.module)
        .orderBy(desc(s.module.weight))
        .limit(1)
        .then((rows) => rows[0]?.weight ?? 0)

      const rows = await tx
        .insert(s.module)
        .values({
          title: item.title,
          handle: item.handle,
          weight: currentHeighestWeight + 1,
        })
        .returning({ id: s.module.id })

      const row = singleRow(rows)
      return row
    }),
)

export const fromHandle = withZod(handleSchema, async (handle) => {
  const query = useQuery()

  const rows = await query
    .select({
      id: s.module.id,
      title: s.module.title,
      handle: s.module.handle,
    })
    .from(s.module)
    .where(eq(s.module.handle, handle))

  return possibleSingleRow(rows) ?? null
})
