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
import { location } from './location.js'
import { actor } from './user.js'

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
    locationId: uuid('location_id').notNull(),
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

export const rolePrivilege = pgTable(
  'role_privilege',
  {
    roleId: uuid('role_id').notNull(),
    privilegeId: uuid('privilege_id').notNull(),
    ...timestamps,
    insertedBy: uuid('inserted_by').notNull(),
    deletedBy: uuid('deleted_by'),
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
      insertedByReference: foreignKey({
        columns: [table.insertedBy],
        foreignColumns: [actor.id],
        name: 'role_privilege_inserted_by_fk',
      }),
      deletedByReference: foreignKey({
        columns: [table.deletedBy],
        foreignColumns: [actor.id],
        name: 'role_privilege_deleted_by_fk',
      }),
    }
  },
)

export const userRole = pgTable(
  'user_role',
  {
    actorId: uuid('actor_id').notNull(),
    roleId: uuid('role_id').notNull(),
    insertedBy: uuid('inserted_by').notNull(),
    deletedBy: uuid('deleted_by'),
    ...timestamps,
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.actorId, table.roleId] }),
      actorReference: foreignKey({
        columns: [table.actorId],
        foreignColumns: [actor.id],
        name: 'user_role_actor_id_fk',
      }),
      roleReference: foreignKey({
        columns: [table.roleId],
        foreignColumns: [role.id],
        name: 'user_role_role_id_fk',
      }),
      insertedByReference: foreignKey({
        columns: [table.insertedBy],
        foreignColumns: [actor.id],
        name: 'user_role_inserted_by_fk',
      }),
      deletedByReference: foreignKey({
        columns: [table.deletedBy],
        foreignColumns: [actor.id],
        name: 'user_role_deleted_by_fk',
      }),
    }
  },
)
