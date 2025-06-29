import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  pgEnum,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { actor, course, person } from "../index.js";
import { pvbOnderdeel } from "./pvb.js";
import { kssSchema } from "./schema.js";
import { kerntaakOnderdeel } from "./toetsdocument.js";

export const kwalificatieVerkregenReden = pgEnum(
  "kwalificatie_verkregen_reden",
  [
    "pvb_behaald", // De kwalificatie is verkregen omdat het gekoppelde pvb is behaald
    "pvb_instructiegroep_basis", // Verkregen op basis van eerder behaald pvb in dezelfde instructieGroep
    "onbekend", // De kwalificatie is geldig, maar we weten niet waarom/wanneer
  ],
);

export const persoonKwalificatie = kssSchema.table(
  "persoon_kwalificatie",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    // PVB that was achieved to obtain this qualification - used when verkregenReden = "pvb_behaald"
    directBehaaldePvbOnderdeelId: uuid("direct_behaalde_pvb_onderdeel_id"),
    // Reference PVB from same instruction group - used when verkregenReden = "pvb_instructiegroep_basis"
    afgeleidePvbOnderdeelId: uuid("afgeleide_pvb_onderdeel_id"),
    courseId: uuid("course_id").notNull(),
    personId: uuid("person_id").notNull(),
    kerntaakOnderdeelId: uuid("kerntaak_onderdeel_id").notNull(),
    verkregenReden: kwalificatieVerkregenReden("verkregen_reden")
      .notNull()
      .default("onbekend"),
    toegevoegdOp: timestamp("toegevoegd_op", {
      withTimezone: true,
      mode: "string",
    }),
    toegevoegdDoor: uuid("toegevoegd_door"),
    opmerkingen: text("opmerkingen"),
  },
  (table) => [
    // Achieved PVB foreign key - enforces that beoordeeldDoor matches the original assessor
    foreignKey({
      columns: [
        table.directBehaaldePvbOnderdeelId,
        table.kerntaakOnderdeelId,
        table.toegevoegdDoor,
      ],
      foreignColumns: [
        pvbOnderdeel.id,
        pvbOnderdeel.kerntaakOnderdeelId,
        pvbOnderdeel.beoordelaarId,
      ],
    }),
    // Basis PVB foreign key - references the original PVB from instruction group
    foreignKey({
      columns: [table.afgeleidePvbOnderdeelId, table.kerntaakOnderdeelId],
      foreignColumns: [pvbOnderdeel.id, pvbOnderdeel.kerntaakOnderdeelId],
    }),
    foreignKey({
      columns: [table.kerntaakOnderdeelId],
      foreignColumns: [kerntaakOnderdeel.id],
    }),
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
    }),
    foreignKey({
      columns: [table.toegevoegdDoor],
      foreignColumns: [actor.id],
    }),
    foreignKey({
      columns: [table.personId],
      foreignColumns: [person.id],
    }),
    uniqueIndex("unique_person_course_kerntaak_onderdeel").on(
      table.personId,
      table.courseId,
      table.kerntaakOnderdeelId,
    ),
    // Business rule constraints based on verkregenReden
    check(
      "verkregen_reden_pvb_behaald_constraint",
      sql`(${table.verkregenReden} != 'pvb_behaald') OR (${table.directBehaaldePvbOnderdeelId} IS NOT NULL AND ${table.afgeleidePvbOnderdeelId} IS NULL)`,
    ),
    check(
      "verkregen_reden_pvb_instructiegroep_basis_constraint",
      sql`(${table.verkregenReden} != 'pvb_instructiegroep_basis') OR (${table.afgeleidePvbOnderdeelId} IS NOT NULL AND ${table.directBehaaldePvbOnderdeelId} IS NULL)`,
    ),
    check(
      "verkregen_reden_onbekend_constraint",
      sql`(${table.verkregenReden} != 'onbekend') OR (${table.directBehaaldePvbOnderdeelId} IS NULL AND ${table.afgeleidePvbOnderdeelId} IS NULL)`,
    ),
  ],
);
