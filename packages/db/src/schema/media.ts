import { sql } from 'drizzle-orm'
import {
  bigint,
  foreignKey,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../utils/sql.js'
import { _objectTable } from './_sb_controlled/storage.js'
import { location } from './location.js'
import { actor } from './user.js'

export const media_status = pgEnum('media_status', [
  'failed',
  'processing',
  'ready',
  'uploaded',
  'corrupt',
])
export const media_type = pgEnum('media_type', ['image', 'file'])

export const media = pgTable(
  'media',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    alt: text('alt'),
    mimeType: text('mime_type'),
    status: media_status('status').notNull(),
    type: media_type('type').notNull(),
    size: bigint('size', { mode: 'number' }).default(0).notNull(),
    object_id: uuid('object_id').notNull(),
    actorId: uuid('actor_id'),
    locationId: uuid('location_id'),
    _metadata: jsonb('_metadata'),
    ...timestamps,
  },
  (table) => {
    return {
      objectReference: foreignKey({
        columns: [table.object_id],
        foreignColumns: [_objectTable.id],
        name: 'media_object_id_fk',
      }),
      actorReference: foreignKey({
        columns: [table.actorId],
        foreignColumns: [actor.id],
        name: 'media_actor_id_fk',
      }),
      locationReference: foreignKey({
        columns: [table.locationId],
        foreignColumns: [location.id],
        name: 'media_location_id_fk',
      }),
    }
  },
)
