import { schema as s } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery, withTransaction } from '../../contexts/index.js'
import {
  handleSchema,
  possibleSingleRow,
  singleRow,
  successfulCreateResponse,
  withZod,
} from '../../utils/index.js'
import { insertSchema, selectSchema } from './gear-type.schema.js'

export const create = withZod(
  insertSchema.pick({
    title: true,
    handle: true,
  }),
  successfulCreateResponse,
  async (item) =>
    withTransaction(async (tx) => {
      const rows = await tx
        .insert(s.gearType)
        .values({
          title: item.title,
          handle: item.handle,
        })
        .returning({ id: s.module.id })

      const row = singleRow(rows)
      return row
    }),
)

export const list = withZod(z.void(), selectSchema.array(), async () => {
  const query = useQuery()

  const rows = await query.select().from(s.module)

  return rows
})

export const fromHandle = withZod(
  handleSchema,
  selectSchema.nullable(),
  async (handle) => {
    const query = useQuery()

    const rows = await query
      .select()
      .from(s.module)
      .where(eq(s.module.handle, handle))

    return possibleSingleRow(rows) ?? null
  },
)
