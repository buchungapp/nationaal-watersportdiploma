import { sql } from "drizzle-orm";
import {
  boolean,
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
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { _usersTable } from "../uncontrolled_schema/auth.js";
import { timestamps } from "../utils/sql.js";
import { location } from "./location.js";
import { country } from "./platform.js";

export const user = pgTable(
  "user",
  {
    authUserId: uuid("auth_user_id").primaryKey().notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    _metadata: jsonb("_metadata"),
  },
  (table) => [
    index("user_idx_email_full_search").using(
      "gin",
      sql`to_tsvector('simple', COALESCE(${table.email}, ''))`,
    ),
    index("user_idx_email_username_search").using(
      "gin",
      sql`to_tsvector('simple', COALESCE(split_part(${table.email}::text, '@', 1), ''))`,
    ),
    index("user_idx_email_domain_search").using(
      "gin",
      sql`to_tsvector('simple', COALESCE(split_part(${table.email}::text, '@', 2), ''))`,
    ),
    foreignKey({
      columns: [table.authUserId],
      foreignColumns: [_usersTable.id],
      name: "user_auth_user_id_fk",
    }),
  ],
);

export const person = pgTable(
  "person",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    userId: uuid("user_id"),
    handle: text("handle"),
    firstName: text("first_name").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    lastNamePrefix: text("last_name_prefix"),
    lastName: text("last_name"),
    dateOfBirth: date("date_of_birth", { mode: "string" }),
    birthCity: text("birth_city"),
    birthCountry: char("birth_country", { length: 2 }).references(
      () => country.alpha_2,
    ),
    ...timestamps,
    _metadata: jsonb("_metadata"),
  },
  (table) => [
    uniqueIndex("person_unq_handle").on(table.handle),
    index("person_idx_handle_search").using(
      "gin",
      sql`to_tsvector('simple', COALESCE(${table.handle}, ''))`,
    ),
    index("person_idx_name_search").using(
      "gin",
      sql`to_tsvector('simple', 
        COALESCE(${table.firstName}, '') || ' ' || 
        COALESCE(${table.lastNamePrefix}, '') || ' ' || 
        COALESCE(${table.lastName}, '')
      )`,
    ),
    index("person_idx_user_id").on(table.userId),
    index("person_idx_is_primary").on(table.isPrimary),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.authUserId],
      name: "person_user_id_fk",
    }),
    uniqueIndex("unq_primary_person")
      .on(table.userId, table.isPrimary)
      .where(sql`${table.isPrimary} = true`),
  ],
);

export const actorType = pgEnum("actor_type", [
  "student",
  "instructor",
  "location_admin",
  "system",
  "pvb_beoordelaar",
  "secretariaat",
]);

export const actor = pgTable(
  "actor",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    type: actorType("type").notNull(),
    personId: uuid("person_id"),
    locationId: uuid("location_id"),
    ...timestamps,
    _metadata: jsonb("_metadata"),
  },
  (table) => [
    foreignKey({
      columns: [table.personId],
      foreignColumns: [person.id],
      name: "actor_person_id_fk",
    }),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [location.id],
      name: "actor_location_link_location_id_fk",
    }),
    unique("unq_actor_type_person_location")
      .on(table.type, table.personId, table.locationId)
      .nullsNotDistinct(),
  ],
);

export const personLocationLinkStatus = pgEnum("person_location_link_status", [
  "linked", // Indicates an active link.
  "revoked", // The person has revoked the link with the location.
  "removed", // The location has removed the link with the person.
]);

// Define a new enum for permission request statuses.
export const permissionRequestStatus = pgEnum("permissionRequestStatus", [
  "none", // No request made.
  "requested", // The location has requested an upgrade in permission level.
  "permission_granted", // Request approved, full data access granted.
]);

export const personLocationLink = pgTable(
  "person_location_link",
  {
    personId: uuid("person_id").notNull(),
    locationId: uuid("location_id").notNull(),
    status: personLocationLinkStatus("status").notNull(),
    permissionLevel: permissionRequestStatus("permission_level")
      .default("none")
      .notNull(), // Tracks permission request state.
    linkedAt: timestamp("linked_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
      mode: "string",
    }),
    removedAt: timestamp("removed_at", {
      withTimezone: true,
      mode: "string",
    }),
    requestedAt: timestamp("requested_at", {
      withTimezone: true,
      mode: "string",
    }),
    grantedAt: timestamp("granted_at", {
      withTimezone: true,
      mode: "string",
    }),
  },
  (table) => [
    primaryKey({
      columns: [table.personId, table.locationId],
      name: "person_location_link_pk",
    }),
    foreignKey({
      columns: [table.personId],
      foreignColumns: [person.id],
      name: "person_location_link_person_id_fk",
    }),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [location.id],
      name: "person_location_link_location_id_fk",
    }),
  ],
);
