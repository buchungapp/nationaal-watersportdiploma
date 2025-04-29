import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../utils/sql.js";
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
