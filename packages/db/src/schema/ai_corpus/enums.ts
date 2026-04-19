import { aiCorpusSchema } from "./schema.js";

// Which product domain a given row belongs to. Add new values via migration
// when a new domain starts using ai_corpus.
export const aiCorpusDomain = aiCorpusSchema.enum("domain", [
  "pvb_portfolio",
  "diplomalijn",
  "knowledge_center",
]);

// Consent semantics:
// - seed           curated/reviewed corpus we control. Public read. Used for
//                  all users' RAG and for model training.
// - opt_in_shared  contributed by a user who explicitly opted in to sharing.
//                  Public read. Treated like seed at retrieval time.
// - user_only      uploaded by a user for their own voice learning. Scoped to
//                  that contributor. Never surfaced to other users.
export const aiCorpusConsentLevel = aiCorpusSchema.enum("consent_level", [
  "seed",
  "opt_in_shared",
  "user_only",
]);
