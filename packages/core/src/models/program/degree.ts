import { schema as s } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import {
  handleSchema,
  possibleSingleRow,
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from '../../utils/index.js'
import { insertSchema, selectSchema } from './degree.schema.js'

export const create = withZod(
  insertSchema.pick({
    title: true,
    handle: true,
    rang: true,
  }),
  successfulCreateResponse,
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

export const list = withZod(z.void(), selectSchema.array(), async () => {
  const query = useQuery()

  const rows = await query.select().from(s.degree)

  return rows
})

export const fromHandle = withZod(
  handleSchema,
  selectSchema.nullable(),
  async (handle) => {
    const query = useQuery()

    const rows = await query
      .select()
      .from(s.degree)
      .where(eq(s.degree.handle, handle))

    return possibleSingleRow(rows) ?? null
  },
)

export const fromId = withZod(
  uuidSchema,
  selectSchema.nullable(),
  async (id) => {
    const query = useQuery()

    const rows = await query.select().from(s.degree).where(eq(s.degree.id, id))

    return possibleSingleRow(rows) ?? null
  },
)
