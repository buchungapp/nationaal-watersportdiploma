import { sql } from 'drizzle-orm'
import {
  foreignKey,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { timestamps } from '../utils/sql.js'
import { token } from './authn.js'
import { location } from './location.js'
import { person } from './user.js'

export const privilege = pgTable(
  'privilege',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text('handle').notNull(),
    title: text('title'),
    description: text('description'),
  },
  (table) => {
    return {
      unqHandle: uniqueIndex().on(table.handle),
    }
  },
)

export const role = pgTable(
  'role',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text('handle').notNull(),
    title: text('title'),
    description: text('description'),
    locationId: uuid('location_id'),
    ...timestamps,
  },
  (table) => {
    return {
      unqHandle: uniqueIndex().on(table.handle),
      locationReference: foreignKey({
        columns: [table.locationId],
        foreignColumns: [location.id],
        name: 'role_location_id_fk',
      }),
    }
  },
)

export const tokenPrivilege = pgTable(
  'token_privilege',
  {
    tokenId: uuid('token_id').notNull(),
    privilegeId: uuid('privilege_id').notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.tokenId, table.privilegeId],
        name: 'role_privilege_pk',
      }),
      tokenReference: foreignKey({
        columns: [table.tokenId],
        foreignColumns: [token.id],
        name: 'role_privilege_token_id_fk',
      }),
      privilegeReference: foreignKey({
        columns: [table.privilegeId],
        foreignColumns: [privilege.id],
        name: 'role_privilege_privilege_id_fk',
      }),
    }
  },
)

export const rolePrivilege = pgTable(
  'role_privilege',
  {
    roleId: uuid('role_id').notNull(),
    privilegeId: uuid('privilege_id').notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.roleId, table.privilegeId],
        name: 'role_privilege_pk',
      }),
      roleReference: foreignKey({
        columns: [table.roleId],
        foreignColumns: [role.id],
        name: 'role_privilege_role_id_fk',
      }),
      privilegeReference: foreignKey({
        columns: [table.privilegeId],
        foreignColumns: [privilege.id],
        name: 'role_privilege_privilege_id_fk',
      }),
    }
  },
)

export const personRole = pgTable(
  'person_role',
  {
    personId: uuid('person_id').notNull(),
    roleId: uuid('role_id').notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.personId, table.roleId] }),
      actorReference: foreignKey({
        columns: [table.personId],
        foreignColumns: [person.id],
        name: 'person_role_person_id_fk',
      }),
      roleReference: foreignKey({
        columns: [table.roleId],
        foreignColumns: [role.id],
        name: 'user_role_role_id_fk',
      }),
    }
  },
)
