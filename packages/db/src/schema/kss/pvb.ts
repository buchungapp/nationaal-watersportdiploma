import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { course } from "../index.js";
import { location } from "../location.js";
import { actor } from "../user.js";
import { kssSchema } from "./schema.js";
import {
  beoordelingscriterium,
  kerntaak,
  kerntaakOnderdeel,
} from "./toetsdocument.js";

export const pvbAanvraagStatus = kssSchema.enum("pvb_aanvraag_status", [
  "concept", // Aanvraag is in concept fase
  "wacht_op_leercoach", // Wachtend op goedkeuring van leercoach
  "beoordelaar_gezocht", // Goedgekeurd, nu beoordelaar(s) zoeken
  "beoordelaar_gevonden", // Beoordelaar(s) hebben zich gemeld
  "ingetrokken", // Aanvraag is ingetrokken door kandidaat, locatie of leercoach
  "wacht_op_beoordeling", // Wachtend op beoordeling
  "afgerond", // Beoordeling is afgerond
  "geannuleerd", // Aanvraag is geannuleerd
]);

export const pvbOnderdeelUitslag = kssSchema.enum("pvb_onderdeel_uitslag", [
  "behaald", // Component succesvol afgerond
  "niet_behaald", // Component niet gehaald
  "nog_niet_bekend", // Uitslag nog niet bekend
]);

export const beoordelaarBeschikbaarheidStatus = kssSchema.enum(
  "beoordelaar_beschikbaarheid_status",
  [
    "geinteresseerd", // Beoordelaar is geïnteresseerd
    "toegewezen", // Beoordelaar is toegewezen
    "afgewezen_door_beoordelaar", // Beoordelaar heeft afgewezen
    "afgewezen_door_secretariaat", // Secretariaat heeft beoordelaar afgewezen
    "afgewezen_door_vaarlocatie", // Vaarlocatie heeft afgewezen
    "ingetrokken", // Beoordelaar heeft interesse ingetrokken
  ],
);

// Hoofdtabel voor gebundelde PvB aanvraag
export const pvbAanvraag = kssSchema.table(
  "pvb_aanvraag",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    kandidaatId: uuid("kandidaat_id").notNull(), // De kandidaat
    leercoachId: uuid("leercoach_id"), // De leercoach (person)
    locatieId: uuid("locatie_id").notNull(), // De vaarlocatie vanuit waar de aanvraag is gedaan
    courseId: uuid("course_id").notNull(),
    opmerkingen: text("opmerkingen"),
    aangemaaktOp: timestamp("aangemaakt_op", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.kandidaatId, table.locatieId],
      foreignColumns: [actor.id, actor.locationId],
    }),
    foreignKey({
      columns: [table.leercoachId],
      foreignColumns: [actor.id],
    }),
    foreignKey({
      columns: [table.locatieId],
      foreignColumns: [location.id],
    }),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
    }),
  ],
);

// Individuele onderdelen binnen een PvB aanvraag
export const pvbOnderdeel = kssSchema.table(
  "pvb_onderdeel",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    pvbAanvraagId: uuid("pvb_aanvraag_id").notNull(),
    kerntaakOnderdeelId: uuid("kerntaak_onderdeel_id").notNull(),
    kerntaakId: uuid("kerntaak_id").notNull(),
    beoordelaarId: uuid("beoordelaar_id"), // Kan per onderdeel verschillen
    uitslag: pvbOnderdeelUitslag("uitslag")
      .default("nog_niet_bekend")
      .notNull(),
    opmerkingen: text("opmerkingen"),
  },
  (table) => [
    foreignKey({
      columns: [table.pvbAanvraagId],
      foreignColumns: [pvbAanvraag.id],
    }),
    foreignKey({
      columns: [table.kerntaakOnderdeelId, table.kerntaakId],
      foreignColumns: [kerntaakOnderdeel.id, kerntaakOnderdeel.kerntaakId],
    }),
    foreignKey({
      columns: [table.kerntaakId],
      foreignColumns: [kerntaak.id],
    }),
    foreignKey({
      columns: [table.beoordelaarId],
      foreignColumns: [actor.id],
    }),
  ],
);

export const pvbOnderdeelBeoordelingsCriterium = kssSchema.table(
  "pvb_onderdeel_beoordelingscriterium",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    pvbOnderdeelId: uuid("pvb_onderdeel_id").notNull(),
    kerntaakId: uuid("kerntaak_id").notNull(),
    beoordelingscriteriumId: uuid("beoordelingscriterium_id").notNull(),
    behaald: boolean("behaald"),
    opmerkingen: text("opmerkingen"),
  },
  (table) => [
    foreignKey({
      columns: [table.pvbOnderdeelId, table.kerntaakId],
      foreignColumns: [pvbOnderdeel.id, pvbOnderdeel.kerntaakId],
    }),
    foreignKey({
      columns: [table.beoordelingscriteriumId, table.kerntaakId],
      foreignColumns: [
        beoordelingscriterium.id,
        beoordelingscriterium.kerntaakId,
      ],
    }),
    foreignKey({
      columns: [table.kerntaakId],
      foreignColumns: [kerntaak.id],
    }),
  ],
);

// Voorgestelde data/tijden voor de gehele aanvraag
export const pvbVoorstelDatum = kssSchema.table(
  "pvb_voorstel_datum",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    pvbAanvraagId: uuid("pvb_aanvraag_id").notNull(),
    startNa: timestamp("start_na", {
      mode: "string",
      withTimezone: true,
    }),
    eindVoor: timestamp("eind_voor", {
      mode: "string",
      withTimezone: true,
    }),
    voorkeur: text("voorkeur"), // bijv. "eerste keuze", "tweede keuze"
    opmerkingen: text("opmerkingen"),
  },
  (table) => [
    foreignKey({
      columns: [table.pvbAanvraagId],
      foreignColumns: [pvbAanvraag.id],
    }),
  ],
);

// Beoordelaars die beschikbaar zijn voor (delen van) de PvB aanvraag
export const pvbBeoordelaarBeschikbaarheid = kssSchema.table(
  "pvb_beoordelaar_beschikbaarheid",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    pvbAanvraagId: uuid("pvb_aanvraag_id").notNull(),
    beoordelaarId: uuid("beoordelaar_id").notNull(), // De beoordelaar
    pvbVoorstelDatumId: uuid("pvb_voorstel_datum_id").notNull(),
    opmerkingen: text("opmerkingen"),
  },
  (table) => [
    foreignKey({
      columns: [table.pvbAanvraagId],
      foreignColumns: [pvbAanvraag.id],
    }),
    foreignKey({
      columns: [table.beoordelaarId],
      foreignColumns: [actor.id],
    }),
    foreignKey({
      columns: [table.pvbVoorstelDatumId, table.pvbAanvraagId],
      foreignColumns: [pvbVoorstelDatum.id, pvbVoorstelDatum.pvbAanvraagId],
    }),
  ],
);

// Junction table: Welke onderdelen kan deze beoordelaar beoordelen?
export const pvbBeoordelaarOnderdeelBeschikbaarheid = kssSchema.table(
  "pvb_beoordelaar_onderdeel_beschikbaarheid",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    pvbBeoordelaarBeschikbaarheidId: uuid(
      "pvb_beoordelaar_beschikbaarheid_id",
    ).notNull(),
    pvbOnderdeelId: uuid("pvb_onderdeel_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.pvbBeoordelaarBeschikbaarheidId],
      foreignColumns: [pvbBeoordelaarBeschikbaarheid.id],
    }),
    foreignKey({
      columns: [table.pvbOnderdeelId],
      foreignColumns: [pvbOnderdeel.id],
    }),
  ],
);

// Volledige audit trail van beschikbaarheid statusveranderingen
export const pvbBeoordelaarBeschikbaarheidStatus = kssSchema.table(
  "pvb_beoordelaar_beschikbaarheid_status",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    pvbBeoordelaarBeschikbaarheidId: uuid(
      "pvb_beoordelaar_beschikbaarheid_id",
    ).notNull(),
    status: beoordelaarBeschikbaarheidStatus("status").notNull(),
    aangemaaktOp: timestamp("aangemaakt_op", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    aangemaaktDoor: uuid("aangemaakt_door").notNull(), // actor.id van wie actie heeft uitgevoerd
    reden: text("reden"), // Waarom deze statusverandering (bijv. "Geen tijd", "Andere prioriteiten")
    opmerkingen: text("opmerkingen"),
  },
  (table) => [
    foreignKey({
      columns: [table.pvbBeoordelaarBeschikbaarheidId],
      foreignColumns: [pvbBeoordelaarBeschikbaarheid.id],
    }),
    foreignKey({
      columns: [table.aangemaaktDoor],
      foreignColumns: [actor.id],
    }),
  ],
);

// Volledige audit trail van alle PvB aanvraag statusveranderingen
export const pvbAanvraagStatusHistory = kssSchema.table(
  "pvb_aanvraag_status_history",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    pvbAanvraagId: uuid("pvb_aanvraag_id").notNull(),
    status: pvbAanvraagStatus("status").notNull(),
    aangemaaktOp: timestamp("aangemaakt_op", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    aangemaaktDoor: uuid("aangemaakt_door").notNull(), // actor.id van wie status heeft gewijzigd
    reden: text("reden"), // Waarom deze statusverandering
    opmerkingen: text("opmerkingen"),
  },
  (table) => [
    foreignKey({
      columns: [table.pvbAanvraagId],
      foreignColumns: [pvbAanvraag.id],
    }),
    foreignKey({
      columns: [table.aangemaaktDoor],
      foreignColumns: [actor.id],
    }),
  ],
);

// Extra courses binnen dezelfde instructiegroep die automatisch moeten worden afgerond
// zodra de PvB succesvol is behaald
export const pvbOnderdeelAanvraagExtraCourse = kssSchema.table(
  "pvb_onderdeel_aanvraag_extra_course",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    pvbOnderdeelId: uuid("pvb_onderdeel_id").notNull(),
    courseId: uuid("course_id").notNull(), // Extra course die automatisch wordt afgerond
    opmerkingen: text("opmerkingen"),
  },
  (table) => [
    foreignKey({
      columns: [table.pvbOnderdeelId],
      foreignColumns: [pvbOnderdeel.id],
    }),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
    }),
    // Unieke combinatie: dezelfde extra course kan niet meerdere keren
    // worden toegevoegd aan dezelfde PvB aanvraag
    uniqueIndex().on(table.pvbOnderdeelId, table.courseId),
  ],
);
