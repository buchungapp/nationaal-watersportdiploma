import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import {
  beoordelingscriterium,
  werkproces,
} from "../kss/toetsdocument.js";
import { aiCorpusSchema } from "./schema.js";
import { source } from "./source.js";

// One retrievable unit — a bewijs paragraph for a pvb_portfolio chunk, a
// section of a diplomalijn article, a paragraph of a knowledge_center doc, ...
//
// Embedding is nullable. Phase 1 retrieval uses exact criterium_id match;
// Phase 2 populates embeddings + builds an HNSW index and adds semantic
// fallback when exact match returns zero rows.
export const chunk = aiCorpusSchema.table(
  "chunk",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    sourceId: uuid("source_id").notNull(),
    content: text("content").notNull(),
    // 1536 dims = OpenAI text-embedding-3-small default. Can be down-projected
    // later if we care about index size. Nullable until the Phase 2 embed job
    // backfills. Once populated, add:
    //   CREATE INDEX chunk_embedding_hnsw
    //     ON ai_corpus.chunk USING hnsw (embedding vector_cosine_ops)
    //     WITH (m = 16, ef_construction = 64);
    embedding: vector("embedding", { dimensions: 1536 }),
    wordCount: integer("word_count").notNull(),
    // Generic quality signal in [0, 10]. Interpretation is per-domain.
    // For pvb_portfolio: concreteness_per_100w (PII tokens + numbers + sport jargon).
    qualityScore: numeric("quality_score", { precision: 5, scale: 2 }),
    // Well-known, FK-enforced references for the pvb_portfolio domain.
    criteriumId: uuid("criterium_id"),
    werkprocesId: uuid("werkproces_id"),
    // Domain-specific non-FK attributes (werkprocesTitel cache, kandidaat
    // source identifier, anything we want to surface in the retrieval result
    // without an extra join).
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.sourceId],
      foreignColumns: [source.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.criteriumId],
      foreignColumns: [beoordelingscriterium.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.werkprocesId],
      foreignColumns: [werkproces.id],
    }).onDelete("cascade"),
    // Primary retrieval path: "give me the highest-quality chunks for this
    // criterium." Partial-index on non-null criterium_id keeps it small.
    index("chunk_criterium_quality_idx").on(
      table.criteriumId,
      table.qualityScore.desc(),
    ),
    index("chunk_source_idx").on(table.sourceId),
  ],
);
