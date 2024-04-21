import { schema as s } from '@nawadi/db'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery, withTransaction } from '../../contexts/index.js'
import {
  handleSchema,
  possibleSingleRow,
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from '../../util/index.js'
import { insertSchema, selectSchema } from './discipline.schema.js'

export const create = withZod(
  insertSchema.pick({
    title: true,
    handle: true,
  }),
  successfulCreateResponse,
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

export const list = withZod(z.void(), selectSchema.array(), async () => {
  const query = useQuery()

  const rows = await query.select().from(s.discipline)

  return rows
})

export const fromHandle = withZod(
  handleSchema,
  selectSchema.nullable(),
  async (handle) => {
    const query = useQuery()

    const rows = await query
      .select()
      .from(s.discipline)
      .where(eq(s.discipline.handle, handle))

    return possibleSingleRow(rows) ?? null
  },
)

export const fromId = withZod(
  uuidSchema,
  selectSchema.nullable(),
  async (id) => {
    const query = useQuery()

    const rows = await query
      .select()
      .from(s.discipline)
      .where(eq(s.discipline.id, id))

    return possibleSingleRow(rows) ?? null
  },
)
