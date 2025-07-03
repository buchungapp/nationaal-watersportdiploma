import { relations } from "drizzle-orm";
import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { curriculum } from "./curriculum.js";
import { actor } from "./user.js";

export const pvbTypeEnum = pgEnum("pvb_type", [
  "instructeur_1",
  "instructeur_2",
  "instructeur_3",
  "instructeur_4",
  "leercoach_4",
  "pvb_beoordelaar_4",
  "pvb_beoordelaar_5",
]);

export const pvbStatusEnum = pgEnum("pvb_status", [
  "concept",
  "wacht_op_voorwaarden",
  "gepland",
  "uitgevoerd",
  "geslaagd",
  "gezakt",
  "geannuleerd",
]);

export const pvbAanvraagTable = pgTable("pvb_aanvraag", {
  id: uuid("id").defaultRandom().primaryKey(),
  handle: text("handle").notNull().unique(),

  // Relations
  kandidaatId: uuid("kandidaat_id")
    .notNull()
    .references(() => actor.id),
  hoofdcursusId: uuid("hoofdcursus_id").references(() => curriculum.id),
  leercoachId: uuid("leercoach_id").references(() => actor.id),
  beoordelaarId: uuid("beoordelaar_id").references(() => actor.id),

  // Basic info
  type: pvbTypeEnum("type").notNull(),
  status: pvbStatusEnum("status").notNull().default("concept"),

  // Planning
  aanvangsdatum: timestamp("aanvangsdatum"),
  aanvangstijd: text("aanvangstijd"), // Time in HH:MM format

  // Additional data
  opmerkingen: text("opmerkingen"),
  kwalificatieprofielen: jsonb("kwalificatieprofielen")
    .$type<string[]>()
    .default([]),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pvbAanvraagRelations = relations(pvbAanvraagTable, ({ one }) => ({
  kandidaat: one(actor, {
    fields: [pvbAanvraagTable.kandidaatId],
    references: [actor.id],
    relationName: "pvb_kandidaat",
  }),
  hoofdcursus: one(curriculum, {
    fields: [pvbAanvraagTable.hoofdcursusId],
    references: [curriculum.id],
  }),
  leercoach: one(actor, {
    fields: [pvbAanvraagTable.leercoachId],
    references: [actor.id],
    relationName: "pvb_leercoach",
  }),
  beoordelaar: one(actor, {
    fields: [pvbAanvraagTable.beoordelaarId],
    references: [actor.id],
    relationName: "pvb_beoordelaar",
  }),
}));
