import { pgSchema } from "drizzle-orm/pg-core";

// Generic retrieval-augmentation corpus. Rows across multiple product domains
// share this schema (see the `domain` enum in ./enums). Today: pvb_portfolio.
// Future: diplomalijn, knowledge_center, etc.
//
// Design invariants:
// - No RLS. Consent enforcement lives in the application query layer, always
//   routed through the helpers in @nawadi/core/models/ai_corpus so nobody
//   forgets the consent clause.
// - No Supabase-specific syntax. Just Postgres + pgvector. Portable to any
//   Postgres host.
// - Well-known foreign keys (profiel_id, criterium_id, werkproces_id for the
//   pvb_portfolio domain) live as nullable columns on source/chunk. Other
//   domains add their own nullable columns via future migrations.
// - Domain-specific attributes that do not need FK enforcement go in the
//   `metadata` jsonb column.
export const aiCorpusSchema = pgSchema("ai_corpus");
