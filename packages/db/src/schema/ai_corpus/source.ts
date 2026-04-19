import { sql } from "drizzle-orm";
import {
  foreignKey,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { kwalificatieprofiel } from "../kss/toetsdocument.js";
import { aiCorpusConsentLevel, aiCorpusDomain } from "./enums.js";
import { aiCorpusSchema } from "./schema.js";

// One row per ingested source document (an anonymised portfolio, a diploma
// spec, a knowledge article, ...). Large blobs live here; the searchable
// units live in ai_corpus.chunk.
export const source = aiCorpusSchema.table(
  "source",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    domain: aiCorpusDomain("domain").notNull(),
    // Stable human-readable identifier, unique within a domain. Examples:
    //   pvb_portfolio: "seed:alle_niveau_3_bob" or "user:<uuid>:<upload_id>"
    sourceIdentifier: text("source_identifier").notNull(),
    // SHA-256 of the content, for deduplication on re-ingest.
    sourceHash: text("source_hash").notNull(),
    content: text("content").notNull(),
    consentLevel: aiCorpusConsentLevel("consent_level").notNull(),
    // Opaque user reference for future upload flows. No FK in Phase 1 — when
    // the auth-backed upload flow lands, either add a FK to auth.users or
    // keep this opaque if we ever host elsewhere.
    contributedByUserId: uuid("contributed_by_user_id"),
    // Well-known, FK-enforced reference for the pvb_portfolio domain. Other
    // domains add their own analogous nullable columns via future migrations.
    profielId: uuid("profiel_id"),
    niveauRang: integer("niveau_rang"),
    // Domain-specific non-FK attributes.
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    charCount: integer("char_count").notNull(),
    pageCount: integer("page_count"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.profielId],
      foreignColumns: [kwalificatieprofiel.id],
    }),
    uniqueIndex("source_domain_hash_unique").on(table.domain, table.sourceHash),
  ],
);
