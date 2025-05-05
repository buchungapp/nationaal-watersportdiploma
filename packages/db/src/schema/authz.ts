import { sql } from "drizzle-orm";
import {
  foreignKey,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../utils/sql.js";
import { token } from "./authn.js";
import { cohortAllocation } from "./cohort.js";
import { location } from "./location.js";
import { person } from "./user.js";

export const privilege = pgTable(
  "privilege",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text("handle").notNull(),
    title: text("title"),
    description: text("description"),
  },
  (table) => [uniqueIndex().on(table.handle)],
);

export const roleType = pgEnum("role_type", [
  "organization",
  "location",
  "cohort",
]);

export const role = pgTable(
  "role",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    handle: text("handle").notNull(),
    title: text("title"),
    description: text("description"),
    locationId: uuid("location_id"),
    type: roleType("type").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex().on(table.handle),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [location.id],
      name: "role_location_id_fk",
    }),
  ],
);

export const tokenPrivilege = pgTable(
  "token_privilege",
  {
    tokenId: uuid("token_id").notNull(),
    privilegeId: uuid("privilege_id").notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({
      columns: [table.tokenId, table.privilegeId],
      name: "token_privilege_pk",
    }),
    foreignKey({
      columns: [table.tokenId],
      foreignColumns: [token.id],
      name: "token_privilege_token_id_fk",
    }),
    foreignKey({
      columns: [table.privilegeId],
      foreignColumns: [privilege.id],
      name: "token_privilege_privilege_id_fk",
    }),
  ],
);

export const rolePrivilege = pgTable(
  "role_privilege",
  {
    roleId: uuid("role_id").notNull(),
    privilegeId: uuid("privilege_id").notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({
      columns: [table.roleId, table.privilegeId],
      name: "role_privilege_pk",
    }),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [role.id],
      name: "role_privilege_role_id_fk",
    }),
    foreignKey({
      columns: [table.privilegeId],
      foreignColumns: [privilege.id],
      name: "role_privilege_privilege_id_fk",
    }),
  ],
);

export const personRole = pgTable(
  "person_role",
  {
    personId: uuid("person_id").notNull(),
    roleId: uuid("role_id").notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.personId, table.roleId] }),
    foreignKey({
      columns: [table.personId],
      foreignColumns: [person.id],
      name: "person_role_person_id_fk",
    }),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [role.id],
      name: "user_role_role_id_fk",
    }),
  ],
);

export const cohortAllocationRole = pgTable(
  "cohort_allocation_role",
  {
    cohortAllocationId: uuid("cohort_allocation_id").notNull(),
    roleId: uuid("role_id").notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.cohortAllocationId, table.roleId] }),
    foreignKey({
      columns: [table.cohortAllocationId],
      foreignColumns: [cohortAllocation.id],
      name: "cohort_allocation_role_allocation_id_fk",
    }),
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [role.id],
      name: "user_role_role_id_fk",
    }),
  ],
);
