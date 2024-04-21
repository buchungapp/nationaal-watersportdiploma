import { sql } from 'drizzle-orm'
import {
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../utils/sql.js'
import { media } from './media.js'

export const location = pgTable(
  'location',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text('handle').notNull(),
    name: text('name'),
    // To prevent a circular dependency, we use a function to reference the media table
    logoMediaId: uuid('logo_media_id').references((): AnyPgColumn => media.id),
    squareLogoMediaId: uuid('square_logo_media_id').references(
      // To prevent a circular dependency, we use a function to reference the media table
      (): AnyPgColumn => media.id,
    ),
    certificateMediaId: uuid('certificate_media_id').references(
      // To prevent a circular dependency, we use a function to reference the media table
      (): AnyPgColumn => media.id,
    ),
    websiteUrl: text('website_url'),
    shortDescription: text('short_description'),
    _metadata: jsonb('_metadata'),
    ...timestamps,
  },
  (table) => {
    return {
      unique_handle_for_location: uniqueIndex('unique_handle_for_location').on(
        table.handle,
      ),
    }
  },
)
