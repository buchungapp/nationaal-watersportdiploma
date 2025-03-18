import { sql } from "drizzle-orm";
import { type AnyPgColumn, foreignKey, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../../utils/sql.js";
import { location } from "../location.js";
import { media } from "../media.js";
import { marketingSchema } from "./schema.js";

export const cashback = marketingSchema.table(
  "cashback",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),

    // Personal information
    full_name: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    postal_code: text("postal_code").notNull(),
    city: text("city").notNull(),

    // Verification information
    // To prevent a circular dependency, we use a function to reference the media table
    verification_media_id: uuid("verification_media_id").references(
      (): AnyPgColumn => media.id,
    ),
    verification_location: text("verification_location").notNull(),

    // Booking information
    booking_location_id: uuid("booking_location_id").references(
      (): AnyPgColumn => location.id,
    ),
    booking_number: text("booking_number").notNull(),

    // Bank information
    iban: text("iban").notNull(),

    ...timestamps,
  },
  (table) => {
    return {
      verification_media_fk: foreignKey({
        columns: [table.verification_media_id],
        foreignColumns: [media.id],
      }),
      booking_location_fk: foreignKey({
        columns: [table.booking_location_id],
        foreignColumns: [location.id],
      }),
    };
  },
);
