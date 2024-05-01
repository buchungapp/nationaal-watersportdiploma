import { schema as s } from '@nawadi/db'
import assert from 'assert'
import { eq, sql } from 'drizzle-orm'
import { fromBuffer } from 'file-type'
import sizeOf from 'image-size'
import crypto from 'node:crypto'
import { z } from 'zod'
import { useQuery, useSupabaseClient } from '../../contexts/index.js'
import {
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from '../../utils/index.js'
import {
  constructBaseUrl,
  constructTransformBaseUrl,
  getNameFromObjectName,
} from './media.helpers.js'
import { outputSchema } from './media.schema.js'

export const create = withZod(
  z.object({
    file: z.instanceof(Buffer),
    isPublic: z.boolean().default(true),
    actorId: uuidSchema.optional(),
    locationId: uuidSchema.optional(),
  }),
  successfulCreateResponse,
  async (input) => {
    const supabase = useSupabaseClient()

    // Determine the file type
    const type = await fromBuffer(input.file)

    if (!type) {
      throw new Error('Failed to determine file type')
    }

    if (!type.mime.startsWith('image/')) {
      throw new Error('Unsupported file type')
    }

    const bucketName = input.isPublic ? 'public-assets' : 'private-assets'

    // Helper function to handle the upload process
    const handleUpload = async () => {
      return await supabase.storage
        .from(bucketName)
        .upload(`${crypto.randomUUID()}.${type.ext}`, input.file, {
          contentType: type.mime,
        })
    }

    let { data, error } = await handleUpload()

    // Attempt to create the bucket and retry the upload if the bucket doesn't exist
    if (error && error.message === 'Bucket not found') {
      await supabase.storage.createBucket(bucketName, {
        public: input.isPublic,
      })
      ;({ data, error } = await handleUpload()) // Retry upload after creating the bucket
    }

    if (error) throw error // Throw any remaining errors

    // Handle possible TypeScript or type errors with data
    if (!data) {
      throw new Error('Failed to upload file')
    }

    const dimensions = sizeOf(input.file)

    const query = useQuery()

    const [media] = await query
      .insert(s.media)
      .values({
        // @ts-expect-error https://github.com/supabase/supabase-js/issues/923
        object_id: data.id,
        alt: '',
        size: input.file.length,
        mimeType: type.mime,
        status: 'ready',
        type: 'image',
        actorId: input.actorId,
        locationId: input.locationId,
        _metadata: sql`(((${JSON.stringify({
          width: dimensions.width,
          height: dimensions.height,
        })})::jsonb)#>> '{}')::jsonb`,
      })
      .returning({ id: s.media.id })

    if (!media) {
      throw new Error('Failed to create media')
    }

    return media
  },
)

export const fromId = withZod(
  uuidSchema,
  outputSchema.nullable(),
  async (id) => {
    const query = useQuery()

    const [mediaRow] = await query
      .select()
      .from(s.media)
      .innerJoin(s._objectTable, eq(s.media.object_id, s._objectTable.id))
      .where(eq(s.media.id, id))

    if (!mediaRow) {
      return null
    }

    const expectedMetadataSchema = z.object({
      width: z
        .number()
        .int()
        .nullable()
        .catch(() => null),
      height: z
        .number()
        .int()
        .nullable()
        .catch(() => null),
    })
    const { height, width } = expectedMetadataSchema.parse(
      mediaRow.media._metadata,
    )

    const bucketId = mediaRow.objects.bucket_id
    const objectName = mediaRow.objects.name

    assert(bucketId, 'Bucket ID is expected')
    assert(objectName, 'Object name is expected')

    return {
      id: mediaRow.media.id,
      type: 'image' as const,
      url: constructBaseUrl(bucketId, objectName),
      transformUrl: constructTransformBaseUrl(bucketId, objectName),
      name: getNameFromObjectName(objectName),
      width,
      height,
      alt: mediaRow.media.alt ?? '',
      size: mediaRow.media.size,
      mimeType: mediaRow.media.mimeType,
      createdAt: mediaRow.media.createdAt,
      updatedAt: mediaRow.media.updatedAt,
    }
  },
)
