import { eq, sql } from 'drizzle-orm'
import {
  char,
  date,
  foreignKey,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { _usersTable } from './_sb_controlled/auth'
import { location } from './location'
import { country } from './platform'

export const user = pgTable(
  'user',
  {
    authUserId: uuid('auth_user_id').primaryKey().notNull(),
    displayName: text('display_name'),
    _metadata: jsonb('_metadata'),
  },
  (table) => {
    return {
      authUserReference: foreignKey({
        columns: [table.authUserId],
        foreignColumns: [_usersTable.id],
        name: 'user_auth_user_id_fk',
      }),
    }
  },
)

export const identityType = pgEnum('identity_type', [
  'student',
  'instructor',
  'location_admin',
])

export const identity = pgTable(
  'identity',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    type: identityType('type').notNull(),
    userId: uuid('user_id'),
    firstName: text('first_name'),
    lastNamePrefix: text('last_name_prefix'),
    lastName: text('last_name'),
    dateOfBirth: date('date_of_birth'),
    birthCity: text('birth_city'),
    birthCountry: char('birth_country', { length: 2 }).references(
      () => country.alpha_2,
    ),
    _metadata: jsonb('_metadata'),
  },
  (table) => {
    return {
      userReference: foreignKey({
        columns: [table.userId],
        foreignColumns: [user.authUserId],
        name: 'identity_user_id_fk',
      }),
      userGlobal: index('user_global').on(table.userId),
      oneInstructorPerAuthUser: uniqueIndex('one_instructor_per_auth_user')
        .on(table.userId)
        .where(eq(table.type, 'instructor')),
      oneLocationAdminPerAuthUser: uniqueIndex(
        'one_location_admin_per_auth_user',
      )
        .on(table.userId)
        .where(eq(table.type, 'location_admin')),
    }
  },
)

export const identityLinkStatus = pgEnum('identity_link_status', [
  'pending',
  'accepted',
  'rejected',
  'revoked',
])

export const locationLinkPermissionLevel = pgEnum(
  'location_link_permission_level',
  // pii_only: Only the identity's PII and curriculum progress that is obtained through the location is shared with the location.
  // all: All of the identity's PII and curriculum progress is shared with the location.
  ['pii_only', 'all'],
)

export const identityLocationLink = pgTable(
  'identity_location_link',
  {
    identityId: uuid('identity_id').notNull(),
    locationId: uuid('location_id').notNull(),
    status: identityLinkStatus('status').notNull(),
    permissionLevel: locationLinkPermissionLevel('permission_level').notNull(),
    requestedAt: timestamp('requested_at', {
      withTimezone: true,
      mode: 'string',
    })
      .defaultNow()
      .notNull(),
    acceptedAt: timestamp('accepted_at', {
      withTimezone: true,
      mode: 'string',
    }),
    rejectedAt: timestamp('rejected_at', {
      withTimezone: true,
      mode: 'string',
    }),
    revokedAt: timestamp('revoked_at', {
      withTimezone: true,
      mode: 'string',
    }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.identityId, table.locationId] }),
      identityReference: foreignKey({
        columns: [table.identityId],
        foreignColumns: [identity.id],
        name: 'identity_location_identity_id_fk',
      }),
      locationReference: foreignKey({
        columns: [table.locationId],
        foreignColumns: [location.id],
        name: 'identity_location_location_id_fk',
      }),
    }
  },
)
