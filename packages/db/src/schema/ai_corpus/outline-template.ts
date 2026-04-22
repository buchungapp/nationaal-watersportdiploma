import { sql } from "drizzle-orm";
import {
  foreignKey,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { kwalificatieprofiel } from "../kss/toetsdocument.js";
import { aiCorpusSchema } from "./schema.js";

// Structural outline for a kwalificatieprofiel's portfolio.
//
// Each row is a versioned template describing what sections a complete
// portfolio for that profiel contains — in order, with descriptions, target
// lengths, and who fills each section (user / ai / rubric-driven).
//
// One row per (profielId, version). Regenerate with a bumped version to
// iterate; getOutlineTemplate returns the highest version for a profiel.
//
// Section shapes are not enforced by SQL — the TS types below are the source
// of truth, validated at write-time by the core model.

export type OutlineSectionKind =
  | "voorwoord"
  | "zeil_cv"
  | "inleiding"
  | "context"
  | "pvb_werkproces"
  | "reflectie"
  | "bijlagen"
  | "other";

export type OutlineSectionFilledBy = "user" | "ai" | "rubric_driven";

export type OutlineSection = {
  ordinal: number;
  kind: OutlineSectionKind;
  title: string;
  description: string;
  targetWordCountMin: number | null;
  targetWordCountMax: number | null;
  filledBy: OutlineSectionFilledBy;
  // Populated for kind='pvb_werkproces' only.
  werkprocesId: string | null;
  kerntaakId: string | null;
};

export const outlineTemplate = aiCorpusSchema.table(
  "outline_template",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    profielId: uuid("profiel_id").notNull(),
    version: integer("version").notNull().default(1),
    sections: jsonb("sections").$type<OutlineSection[]>().notNull(),
    // Notes: free-form metadata about how this template was produced
    // (e.g. "deterministic from rubric", "refined via LLM pass against corpus").
    notes: jsonb("notes")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    generatedAt: timestamp("generated_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.profielId],
      foreignColumns: [kwalificatieprofiel.id],
    }).onDelete("cascade"),
    uniqueIndex("outline_template_profiel_version_unique").on(
      table.profielId,
      table.version,
    ),
  ],
);
