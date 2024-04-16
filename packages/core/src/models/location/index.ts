import { schema } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { zod } from '../../util/zod.js'

export * as Location from './index.js'

const location = schema.location

export const Info = createSelectSchema(location, {
  handle(schema) {
    return schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/)
  },
  logoMediaId: (schema) => schema.logoMediaId.uuid(),
  squareLogoMediaId: (schema) => schema.squareLogoMediaId.uuid(),
  websiteUrl: (schema) => schema.websiteUrl.url(),
})
export type Info = typeof location.$inferSelect

export const create = zod(
  Info.pick({
    title: true,
    handle: true,
    name: true,
    websiteUrl: true,
  }).partial({
    name: true,
    websiteUrl: true,
  }),
  async (input) => {
    const query = useQuery()
    const [insert] = await query
      .insert(location)
      .values({
        ...input,
      })
      .returning({ id: location.id })

    if (!insert) {
      throw new Error('Failed to insert location')
    }

    return insert.id
  },
)

export const list = zod(z.void(), async () => {
  const query = useQuery()
  return await query.select().from(location)
})

export const fromId = zod(Info.shape.id, async (id) => {
  const query = useQuery()
  return await query
    .select()
    .from(location)
    .where(eq(location.id, id))
    .then((rows) => rows[0])
})

export const fromHandle = zod(Info.shape.handle, async (handle) => {
  const query = useQuery()
  return await query
    .select()
    .from(location)
    .where(eq(location.handle, handle))
    .then((rows) => rows[0])
})
