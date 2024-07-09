import { schema as s, uncontrolledSchema as us } from '@nawadi/db'
import { and, eq, getTableColumns, isNull } from 'drizzle-orm'
import assert from 'node:assert'
import { z } from 'zod'
import { useQuery, useSupabaseClient } from '../../main.js'
import { singleRow, withZod } from '../../utils/index.js'

export const list = withZod(z.void(), async () => {
  const query = useQuery()

  const { object_id, actorId, locationId, status, type, ...selectFields } =
    getTableColumns(s.media)

  const rows = await query
    .select({
      ...selectFields,
    })
    .from(s.media)
    .where(
      and(
        isNull(s.media.deletedAt),
        isNull(s.media.locationId),
        eq(s.media.type, 'file'),
      ),
    )

  return rows
})

export const createSignedDocumentUrl = withZod(
  z.object({
    id: z.string().uuid(),
  }),
  z.string().url(),
  async ({ id }) => {
    const query = useQuery()
    const supabase = useSupabaseClient()

    const mediaRow = await query
      .select({
        fileName: s.media.name,
        bucketId: us._objectTable.name,
        path: us._objectTable.name,
      })
      .from(s.media)
      .innerJoin(us._objectTable, eq(s.media.object_id, us._objectTable.id))
      .where(
        and(
          isNull(s.media.deletedAt),
          eq(s.media.id, id),
          eq(s.media.type, 'file'),
        ),
      )
      .then(singleRow)

    assert(mediaRow.bucketId, 'Bucket ID is required')
    assert(mediaRow.path, 'Path is required')

    const { data, error } = await supabase.storage
      .from(mediaRow.bucketId)
      .createSignedUrl(mediaRow.path, 60 * 5, {
        download: mediaRow.fileName ?? true,
      })

    if (error) {
      throw error
    }

    return data.signedUrl
  },
)
