import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  foreignKey,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../utils/sql.js";
import { discipline, gearType } from "./course.js";
import { media } from "./media.js";

export const locationStatus = pgEnum("location_status", [
  "draft",
  "active",
  "hidden",
  "archived",
]);

export const location = pgTable(
  "location",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    status: locationStatus("status").notNull().default("active"),
    handle: text("handle").notNull(),
    name: text("name"),
    // To prevent a circular dependency, we use a function to reference the media table
    logoMediaId: uuid("logo_media_id").references((): AnyPgColumn => media.id),
    squareLogoMediaId: uuid("square_logo_media_id").references(
      // To prevent a circular dependency, we use a function to reference the media table
      (): AnyPgColumn => media.id,
    ),
    certificateMediaId: uuid("certificate_media_id").references(
      // To prevent a circular dependency, we use a function to reference the media table
      (): AnyPgColumn => media.id,
    ),
    websiteUrl: text("website_url"),
    email: text("email"),
    shortDescription: text("short_description"),
    _metadata: jsonb("_metadata"),
    ...timestamps,
  },
  (table) => [uniqueIndex("unique_handle_for_location").on(table.handle)],
);

/**
 * How to add a new resource type:
 * 1. Add the resource id to the table
 * 2. Update the check constraint to include the new resource
 * 3. Add the unique index for the new resource
 */

export const locationResourceLink = pgTable(
  "location_resource_link",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    locationId: uuid("location_id").notNull(),
    gearTypeId: uuid("gear_type_id"),
    disciplineId: uuid("discipline_id"),
    ...timestamps,
  },
  (table) => [
    check(
      "location_resource_link_required_one_resource",
      sql`(
        (gear_type_id is not null)::int + 
        (discipline_id is not null)::int = 1
      )`,
    ),
    uniqueIndex("location_gear_type_unique").on(
      table.locationId,
      table.gearTypeId,
    ),
    uniqueIndex("location_discipline_unique").on(
      table.locationId,
      table.disciplineId,
    ),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [location.id],
      name: "location_resource_link_location_id_fk",
    }),
    foreignKey({
      columns: [table.gearTypeId],
      foreignColumns: [gearType.id],
      name: "location_resource_link_gear_type_id_fk",
    }),
    foreignKey({
      columns: [table.disciplineId],
      foreignColumns: [discipline.id],
      name: "location_resource_link_discipline_id_fk",
    }),
  ],
);
