// Centralized model ids for Anthropic calls routed through the Vercel
// AI Gateway. Each export picks out a distinct ROLE the model plays in
// our system — not a distinct model. Today they all point at the same
// Sonnet build; the separation exists so we can swap roles
// independently later (e.g. use a cheaper model for summarization when
// a better cheap option ships, without touching the chat path).
//
// Keep runtime call sites using these constants. Corpus / eval scripts
// that need reproducible outputs pin their own literal ids so a future
// bump here doesn't silently invalidate historical eval baselines.

/**
 * User-facing leercoach conversational model. Streamed in real time,
 * carries the full system prompt + rubric + tool schemas, and owns the
 * user's perception of "how smart is this thing." Pick the newest
 * stable Sonnet.
 */
export const CHAT_MODEL = "anthropic/claude-sonnet-4-6" as const;

/**
 * Summarization / condensation role: compaction of long chats, per-
 * werkproces storyline synthesis in the rubric drawer, artefact
 * ingestion summaries. Needs 1M-token context for compaction (a
 * long leercoach session can carry more than Haiku's 200k), and
 * should match Sonnet's phrasing quality so the summaries blend in
 * with the chat when re-injected.
 */
export const SUMMARIZATION_MODEL = "anthropic/claude-sonnet-4-6" as const;

/**
 * Vision / OCR model for image-based artefact extraction (screenshots
 * of notes, whiteboards, etc.). Currently the same Sonnet build —
 * separated by role so if Anthropic ships a dedicated vision variant
 * we can swap one constant.
 */
export const VISION_MODEL = "anthropic/claude-sonnet-4-6" as const;
