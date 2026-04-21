import { pgSchema } from "drizzle-orm/pg-core";

// Leercoach chat sessions — the persistent conversational surface that
// replaces the Phase 1 form-shaped portfolio-helper sandbox.
//
// Design invariants (mirroring ai_corpus):
// - No RLS. Access control enforced at the application layer through the
//   helpers in @nawadi/core/models/leercoach so userId scoping is consistent.
// - No cross-schema foreign keys to auth.users. Supabase owns that table;
//   we store userId as a UUID with app-layer validation instead.
// - Chat scope lives in a jsonb column (N3 always full profiel; N4/N5 can
//   be full profiel, single kerntaak, or bundle of kerntaken — per Q1
//   decision in leercoach-pivot.md).
// - Message parts follow the AI SDK UIMessage shape (jsonb array) so future
//   additions (tool calls, artifacts, inline bewijs drafts) land without
//   schema churn.
export const leercoachSchema = pgSchema("leercoach");
