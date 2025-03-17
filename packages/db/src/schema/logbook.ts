import { sql } from "drizzle-orm";
import {
  foreignKey,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../utils/sql.js";
import { person } from "./user.js";

export const logbook = pgTable(
  "logbook",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    personId: uuid("person_id").notNull(),

    startedAt: timestamp("started_at", {
      mode: "string",
      withTimezone: true,
    }).notNull(),
    endedAt: timestamp("ended_at", {
      mode: "string",
      withTimezone: true,
    }),

    departurePort: text("departure_port"),
    arrivalPort: text("arrival_port"),

    windPower: integer("wind_power"), // in knots
    windDirection: text("wind_direction"),

    boatType: text("boat_type"),
    boatLength: numeric("boat_length"), // in meters

    location: text("location"),

    sailedNauticalMiles: numeric("sailed_nautical_miles"),
    sailedHoursInDark: numeric("sailed_hours_in_dark"),

    primaryRole: text("primary_role"),
    crewNames: text("crew_names"),

    conditions: text("conditions"),
    additionalComments: text("additional_comments"),

    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.personId],
      foreignColumns: [person.id],
      name: "logbook_person_id_fk",
    }),
  ],
);
