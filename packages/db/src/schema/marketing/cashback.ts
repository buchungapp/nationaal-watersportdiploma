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
    // Applicant information
    applicantFullName: text("applicant_full_name").notNull(),
    applicantEmail: text("applicant_email").notNull(),
    applicantIban: text("applicant_iban").notNull(),

    // Student information
    studentFullName: text("student_full_name").notNull(),

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

    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.verificationMediaId],
      foreignColumns: [media.id],
    }),
    foreignKey({
      columns: [table.bookingLocationId],
      foreignColumns: [location.id],
    }),
  ],
);
