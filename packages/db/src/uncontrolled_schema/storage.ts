import { jsonb, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const _objectTable = pgSchema('storage').table('objects', {
  id: uuid('id').primaryKey().notNull(),
  bucket_id: text('bucket_id'),
  name: text('name'),
  owner: uuid('owner'),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
  last_accessed_at: timestamp('last_accessed_at', {
    withTimezone: true,
    mode: 'string',
  }),
  metadata: jsonb('metadata'),
  path_tokens: text('path_tokens').array(),
  version: text('version'),
})
