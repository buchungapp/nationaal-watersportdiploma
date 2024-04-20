import { schema as s } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { singleRow } from '../../util/data-helpers.js'
import {
  handleSchema,
  titleSchema,
  uuidSchema,
  withZod,
} from '../../util/zod.js'

export const create = withZod(
  z.object({
    handle: handleSchema,
    name: titleSchema.optional(),
    websiteUrl: z.string().url().optional(),
  }),
  async (input) => {
    const query = useQuery()
    const [insert] = await query
      .insert(s.location)
      .values({
        ...input,
      })
      .returning({ id: s.location.id })

    if (!insert) {
      throw new Error('Failed to insert location')
    }

    return insert
  },
)

export const list = withZod(z.void(), async () => {
  const query = useQuery()
  return await query
    .select({
      id: s.location.id,
      handle: s.location.handle,
      name: s.location.name,
      websiteUrl: s.location.websiteUrl,
    })
    .from(s.location)
})

export const fromId = withZod(uuidSchema, async (id) => {
  const query = useQuery()
  return await query
    .select({
      id: s.location.id,
      handle: s.location.handle,
      name: s.location.name,
      websiteUrl: s.location.websiteUrl,
    })
    .from(s.location)
    .where(eq(s.location.id, id))
    .then((rows) => singleRow(rows))
})

export const fromHandle = withZod(handleSchema, async (handle) => {
  const query = useQuery()
  return await query
    .select({
      id: s.location.id,
      handle: s.location.handle,
      name: s.location.name,
      websiteUrl: s.location.websiteUrl,
    })
    .from(s.location)
    .where(eq(s.location.handle, handle))
    .then((rows) => singleRow(rows))
})
