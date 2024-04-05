import { pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const _usersTable = pgSchema('auth').table('users', {
  id: uuid('id').primaryKey().notNull(),
  email: text('email'),
  email_confirmed_at: timestamp('email_confirmed_at', {
    withTimezone: true,
    mode: 'string',
  }),
  invited_at: timestamp('invited_at', { withTimezone: true, mode: 'string' }),
  last_login_at: timestamp('last_login_at', {
    withTimezone: true,
    mode: 'string',
  }),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' }),
  updated_at: timestamp('updated_at', { withTimezone: true, mode: 'string' }),
  phone: text('phone'),
  phone_confirmed_at: timestamp('phone_confirmed_at', {
    withTimezone: true,
    mode: 'string',
  }),
  confirmed_at: timestamp('confirmed_at', {
    withTimezone: true,
    mode: 'string',
  }),
  banned_until: timestamp('banned_until', {
    withTimezone: true,
    mode: 'string',
  }),
  deleted_at: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
})
