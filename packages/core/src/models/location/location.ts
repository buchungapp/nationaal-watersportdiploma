import { schema as s } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { singleRow } from '../../utils/data-helpers.js'
import {
  handleSchema,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from '../../utils/zod.js'
import { Platform } from '../index.js'
import { insertSchema, outputSchema } from './location.schema.js'

export const create = withZod(
  insertSchema.pick({
    handle: true,
    name: true,
    websiteUrl: true,
  }),
  successfulCreateResponse,
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

export const list = withZod(z.void(), outputSchema.array(), async () => {
  const query = useQuery()
  return await query
    .select()
    .from(s.location)
    .then((rows) =>
      rows.map((row) => ({
        ...row,
        // TODO: Implement media in list procedure
        logo: null,
        logoSquare: null,
        logoCertificate: null,
      })),
    )
})

export const fromId = withZod(uuidSchema, outputSchema, async (id) => {
  const query = useQuery()
  const location = await query
    .select()
    .from(s.location)
    .where(eq(s.location.id, id))
    .then((rows) => singleRow(rows))

  const [logo, squareLogo, certificateLogo] = await Promise.all([
    location.logoMediaId ? Platform.Media.fromId(location.logoMediaId) : null,
    location.squareLogoMediaId
      ? Platform.Media.fromId(location.squareLogoMediaId)
      : null,
    location.certificateMediaId
      ? Platform.Media.fromId(location.certificateMediaId)
      : null,
  ])

  return {
    ...location,
    logo,
    logoSquare: squareLogo,
    logoCertificate: certificateLogo,
  }
})

export const fromHandle = withZod(
  handleSchema,
  outputSchema,
  async (handle) => {
    const query = useQuery()

    const location = await query
      .select()
      .from(s.location)
      .where(eq(s.location.handle, handle))
      .then((rows) => singleRow(rows))

    const [logo, squareLogo, certificateLogo] = await Promise.all([
      location.logoMediaId ? Platform.Media.fromId(location.logoMediaId) : null,
      location.squareLogoMediaId
        ? Platform.Media.fromId(location.squareLogoMediaId)
        : null,
      location.certificateMediaId
        ? Platform.Media.fromId(location.certificateMediaId)
        : null,
    ])

    return {
      ...location,
      logo,
      logoSquare: squareLogo,
      logoCertificate: certificateLogo,
    }
  },
)
