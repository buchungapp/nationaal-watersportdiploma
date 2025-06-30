import { sql } from "drizzle-orm";
import { foreignKey, integer, text, unique, uuid } from "drizzle-orm/pg-core";
import { kssSchema } from "./schema.js";

export const richting = kssSchema.enum("richting", [
  "instructeur",
  "leercoach",
  "pvb_beoordelaar",
]);

export const kerntaakOnderdeelType = kssSchema.enum("kerntaakOnderdeelType", [
  "portfolio",
  "praktijk",
]);

export const kerntaakType = kssSchema.enum("kerntaakType", [
  "verplicht",
  "facultatief",
]);

// 1 t/m 5
export const niveau = kssSchema.table(
  "niveau",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    rang: integer("rang").notNull(),
  },
  (table) => [],
);

// Instructeur 2, Leercoach 3 etc.
export const kwalificatieprofiel = kssSchema.table(
  "kwalificatieprofiel",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    titel: text("titel").notNull(),
    richting: richting("richting").notNull(),
    niveauId: uuid("niveau_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.niveauId],
      foreignColumns: [niveau.id],
    }),
  ],
);

// 2.1. Geven van lessen
export const kerntaak = kssSchema.table(
  "kerntaak",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    titel: text("titel").notNull(),
    kwalificatieprofielId: uuid("kwalificatieprofiel_id").notNull(),
    type: kerntaakType("type").notNull(),
    rang: integer("rang"),
  },
  (table) => [
    foreignKey({
      columns: [table.kwalificatieprofielId],
      foreignColumns: [kwalificatieprofiel.id],
    }),
  ],
);

// Junction table: Een kerntaak kan getoetst worden met portfolio, praktijk, of beiden
export const kerntaakOnderdeel = kssSchema.table(
  "kerntaak_onderdeel",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    kerntaakId: uuid("kerntaak_id").notNull(),
    type: kerntaakOnderdeelType("beoordelingsType").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.kerntaakId],
      foreignColumns: [kerntaak.id],
    }),
    unique().on(table.id, table.kerntaakId),
  ],
);

// Werkproces 2.1.4 Evalueert lessen en reflecteert op eigen handelen
export const werkproces = kssSchema.table(
  "werkproces",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    kerntaakId: uuid("kerntaak_id").notNull(),
    titel: text("titel").notNull(),
    resultaat: text("resultaat").notNull(),
    rang: integer("rang").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.kerntaakId],
      foreignColumns: [kerntaak.id],
    }),
    unique().on(table.id, table.kerntaakId),
  ],
);

// Stelt zich stimulerend, positief en open op tegenover individu en groep. Houdt goed contact met alle cursisten.
export const beoordelingscriterium = kssSchema.table(
  "beoordelingscriterium",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    werkprocesId: uuid("werkproces_id").notNull(),
    kerntaakId: uuid("kerntaak_id").notNull(),
    rang: integer("rang").notNull(),
    omschrijving: text("omschrijving").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.werkprocesId, table.kerntaakId],
      foreignColumns: [werkproces.id, werkproces.kerntaakId],
    }),
    foreignKey({
      columns: [table.kerntaakId],
      foreignColumns: [kerntaak.id],
    }),
    unique().on(table.id, table.kerntaakId),
  ],
);
