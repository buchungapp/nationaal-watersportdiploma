import { sql } from 'drizzle-orm'
import {
  pgTable,
  text,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { media } from './media'

export const location = pgTable(
  'location',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text('handle').notNull(),
    name: text('name').notNull(),
    // To prevent a circular dependency, we use a function to reference the media table
    logoMediaId: uuid('logo_media_id').references((): AnyPgColumn => media.id),
    squareLogoMediaId: uuid('square_logo_media_id').references(
      // To prevent a circular dependency, we use a function to reference the media table
      (): AnyPgColumn => media.id,
    ),
    website_url: text('website_url'),
  },
  (table) => {
    return {
      unique_handle_for_location: uniqueIndex('unique_handle_for_location').on(
        table.handle,
      ),
    }
  },
)
