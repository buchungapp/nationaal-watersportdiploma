import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  jsonb,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { course, instructieGroep } from "../index.js";
import { location } from "../location.js";
import { actor, person } from "../user.js";
import { kssSchema } from "./schema.js";
import {
  beoordelingscriterium,
  kerntaak,
  kerntaakOnderdeel,
} from "./toetsdocument.js";

export const aanvraagStatus = kssSchema.enum("aanvraag_status", [
  "concept", // Aanvraag is in concept/draft fase
  "wacht_op_voorwaarden", // Wacht op vervulling van alle voorwaarden (parallel: leercoach toestemming, beoordelaar toewijzing, startdatum planning)
  "gereed_voor_beoordeling", // Alle voorwaarden vervuld, klaar voor beoordeling
  "in_beoordeling", // Beoordeling is gaande
  "afgerond", // Beoordeling is succesvol afgerond
  "ingetrokken", // Aanvraag is ingetrokken door kandidaat of locatie
  "afgebroken", // PvB is afgebroken gedurende de beoordeling
]);

export const pvbAanvraagType = kssSchema.enum("pvb_aanvraag_type", [
  "intern",
  "extern",
]);

export const pvbOnderdeelUitslag = kssSchema.enum("pvb_onderdeel_uitslag", [
  "behaald", // Component succesvol afgerond
  "niet_behaald", // Component niet gehaald
  "nog_niet_bekend", // Uitslag nog niet bekend
]);

export const beoordelaarBeschikbaarheidsstatus = kssSchema.enum(
  "beoordelaar_beschikbaarheidsstatus",
  [
    "geinteresseerd", // Beoordelaar is geïnteresseerd
    "toegewezen", // Beoordelaar is toegewezen
    "afgewezen_door_beoordelaar", // Beoordelaar heeft afgewezen
    "afgewezen_door_secretariaat", // Secretariaat heeft beoordelaar afgewezen
    "afgewezen_door_vaarlocatie", // Vaarlocatie heeft afgewezen
    "ingetrokken", // Beoordelaar heeft interesse ingetrokken
  ],
);

// Event types for comprehensive event tracking (both aanvraag and onderdeel level)
export const pvbGebeurtenisType = kssSchema.enum("pvb_gebeurtenis_type", [
  // Core workflow events
  "aanvraag_ingediend",
  "leercoach_toestemming_gevraagd",
  "leercoach_toestemming_gegeven",
  "leercoach_toestemming_geweigerd",
  "voorwaarden_voltooid",
  "beoordeling_gestart",
  "beoordeling_afgerond",
  "aanvraag_ingetrokken",

  // Component events
  "onderdeel_toegevoegd",
  "onderdeel_beoordelaar_gewijzigd",
  "onderdeel_uitslag_gewijzigd",
  "onderdeel_startdatum_gewijzigd",
]);

// Leercoach permission status
export const leercoachToestemmingStatus = kssSchema.enum(
  "leercoach_toestemming_status",
  [
    "gevraagd", // Toestemming is gevraagd
    "gegeven", // Toestemming is gegeven
    "geweigerd", // Toestemming is geweigerd
    "herroepen", // Toestemming is herroepen
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
    handle: text("handle").notNull().unique(),
    kandidaatId: uuid("kandidaat_id").notNull(), // De kandidaat
    locatieId: uuid("locatie_id").notNull(), // De vaarlocatie vanuit waar de aanvraag is gedaan
    type: pvbAanvraagType("type").notNull(),
    opmerkingen: text("opmerkingen"),
  },
  (table) => [
    foreignKey({
      columns: [table.kandidaatId],
      foreignColumns: [person.id],
    }),
    foreignKey({
      columns: [table.locatieId],
      foreignColumns: [location.id],
    }),
  ],
);

export const pvbAanvraagCourse = kssSchema.table(
  "pvb_aanvraag_course",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    pvbAanvraagId: uuid("pvb_aanvraag_id").notNull(),
    courseId: uuid("course_id").notNull(),
    instructieGroepId: uuid("instructie_groep_id").notNull(),
    isMainCourse: boolean("is_main_course").notNull(),
    opmerkingen: text("opmerkingen"),
  },
  (table) => [
    foreignKey({
      columns: [table.pvbAanvraagId],
      foreignColumns: [pvbAanvraag.id],
    }),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
    }),
    foreignKey({
      columns: [table.instructieGroepId],
      foreignColumns: [instructieGroep.id],
    }),
    // Ensure exactly one main course per PvB aanvraag
    uniqueIndex()
      .on(table.pvbAanvraagId, table.instructieGroepId)
      .where(sql`${table.isMainCourse} = true`),
    uniqueIndex().on(
      table.pvbAanvraagId,
      table.instructieGroepId,
      table.courseId,
    ),
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
    startDatumTijd: timestamp("start_datum_tijd", {
      withTimezone: true,
      mode: "string",
    }),
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
    uniqueIndex(
      "pvb_onderdeel_aanvraag_id_kerntaak_onderdeel_id_beoordelaar_id_unique",
    ).on(table.pvbAanvraagId, table.kerntaakOnderdeelId, table.beoordelaarId),
    uniqueIndex("pvb_onderdeel_aanvraag_id_kerntaak_onderdeel_id_unique").on(
      table.pvbAanvraagId,
      table.kerntaakOnderdeelId,
    ),
    // These are needed for the foreign key constraints
    unique("pvb_onderdeel_id_kerntaak_onderdeel_id_unique").on(
      table.id,
      table.kerntaakOnderdeelId,
    ),
    unique("pvb_onderdeel_id_kerntaak_onderdeel_id_beoordelaar_id_unique").on(
      table.id,
      table.kerntaakOnderdeelId,
      table.beoordelaarId,
    ),
    unique("pvb_onderdeel_id_kerntaak_id_unique").on(
      table.id,
      table.kerntaakId,
    ),
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
    unique().on(table.id, table.pvbAanvraagId),
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
    status: beoordelaarBeschikbaarheidsstatus("status").notNull(),
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

// Event logging for comprehensive event tracking (both aanvraag and onderdeel level)
export const pvbGebeurtenis = kssSchema.table(
  "pvb_gebeurtenis",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    pvbAanvraagId: uuid("pvb_aanvraag_id").notNull(),
    pvbOnderdeelId: uuid("pvb_onderdeel_id"), // Optional: for onderdeel-specific events
    gebeurtenisType: pvbGebeurtenisType("gebeurtenis_type").notNull(),
    data: jsonb("data"), // Flexible JSONB data for event-specific information
    aangemaaktOp: timestamp("aangemaakt_op", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    aangemaaktDoor: uuid("aangemaakt_door").notNull(), // actor.id van wie event heeft geinitieerd
    reden: text("reden"), // Waarom deze gebeurtenis
    opmerkingen: text("opmerkingen"),
  },
  (table) => [
    foreignKey({
      columns: [table.pvbAanvraagId],
      foreignColumns: [pvbAanvraag.id],
    }),
    foreignKey({
      columns: [table.pvbOnderdeelId],
      foreignColumns: [pvbOnderdeel.id],
    }),
    foreignKey({
      columns: [table.aangemaaktDoor],
      foreignColumns: [actor.id],
    }),
  ],
);

// Explicit leercoach permission tracking for parallel process
export const pvbLeercoachToestemming = kssSchema.table(
  "pvb_leercoach_toestemming",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    pvbAanvraagId: uuid("pvb_aanvraag_id").notNull(),
    leercoachId: uuid("leercoach_id").notNull(),
    status: leercoachToestemmingStatus("status").notNull(),
    aangemaaktOp: timestamp("aangemaakt_op", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    aangemaaktDoor: uuid("aangemaakt_door").notNull(), // actor.id van wie actie heeft uitgevoerd
    reden: text("reden"), // Waarom deze status (bijv. "Geen tijd", "Kandidaat niet klaar")
    opmerkingen: text("opmerkingen"),
  },
  (table) => [
    foreignKey({
      columns: [table.pvbAanvraagId],
      foreignColumns: [pvbAanvraag.id],
    }),
    foreignKey({
      columns: [table.leercoachId],
      foreignColumns: [person.id],
    }),
    foreignKey({
      columns: [table.aangemaaktDoor],
      foreignColumns: [actor.id],
    }),
    // Index optimized for querying most recent status per aanvraag+leercoach
    index("pvb_leercoach_toestemming_recent_idx").on(
      table.pvbAanvraagId,
      table.leercoachId,
      table.aangemaaktOp.desc(),
    ),
    // Additional index for status filtering
    index("pvb_leercoach_toestemming_status_idx").on(
      table.pvbAanvraagId,
      table.leercoachId,
      table.status,
    ),
  ],
);

// Volledige audit trail van alle PvB aanvraag statusveranderingen
export const pvbAanvraagStatus = kssSchema.table(
  "pvb_aanvraag_status",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    pvbAanvraagId: uuid("pvb_aanvraag_id").notNull(),
    status: aanvraagStatus("status").notNull(),
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
