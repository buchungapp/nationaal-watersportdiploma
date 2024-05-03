import { schema as s } from '@nawadi/db'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const selectSchema = createSelectSchema(s.media, {
  alt: (schema) => schema.alt.default(''),
})

export const outputSchema = selectSchema
  .pick({
    id: true,
    alt: true,
    size: true,
    mimeType: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    type: z.literal('image'),
    url: z.string().url(),
    /** The URL of the image which serves as the basis for the image transformations. */
    transformUrl: z.string().url(),
    width: z.number().int().nullable(),
    height: z.number().int().nullable(),
    /** The filename of the media object. */
    name: z.string(),
  })
