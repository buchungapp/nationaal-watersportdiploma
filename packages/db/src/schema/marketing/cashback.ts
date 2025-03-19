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
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    postalCode: text("postal_code").notNull(),
    city: text("city").notNull(),

    // Verification information
    // To prevent a circular dependency, we use a function to reference the media table
    verificationMediaId: uuid("verification_media_id")
      .references((): AnyPgColumn => media.id)
      .notNull(),
    verificationLocation: text("verification_location").notNull(),

    // Booking information
    bookingLocationId: uuid("booking_location_id")
      .references((): AnyPgColumn => location.id)
      .notNull(),
    bookingNumber: text("booking_number").notNull(),

    // Bank information
    iban: text("iban").notNull(),

    ...timestamps,
  },
  (table) => {
    return {
      verificationMediaFk: foreignKey({
        columns: [table.verificationMediaId],
        foreignColumns: [media.id],
      }),
      bookingLocationFk: foreignKey({
        columns: [table.bookingLocationId],
        foreignColumns: [location.id],
      }),
    };
  },
);
