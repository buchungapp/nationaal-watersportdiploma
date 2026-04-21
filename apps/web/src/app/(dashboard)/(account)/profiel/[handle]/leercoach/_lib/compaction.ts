import "server-only";

// Helpers for the compaction pipeline. Kept server-only so the
// char-based token estimator + draft-detection heuristics don't leak
// into the client bundle (they depend on internal message shapes that
// we may tune aggressively).

export type MessageLike = {
  messageId: string;
  role: "user" | "assistant" | "system" | string;
  parts: Array<{ type: string; [key: string]: unknown }>;
  createdAt: string;
};

// Rough char→token ratio for Dutch + English mixed content. Claude's
// tokenizer isn't public; 3.5 is a good middle-ground that
// consistently over-estimates for Dutch (which is what we want: if we
// think we're close to the limit, we'd rather warn early than late).
const CHARS_PER_TOKEN = 3.5;

/**
 * Approximate token count of a message's text content. Skips tool
 * call / result parts (they exist in-context but are the first thing
 * compaction drops anyway — the estimator focuses on the text we'd
 * care about preserving).
 *
 * "Approximate" because running the real tokenizer would require
 * pulling in the full Anthropic tokenizer model. For compaction
 * decisions an estimate is enough — the server's actual budget is
 * enforced by the upstream API, not this helper.
 */
export function approximateMessageTokens(message: MessageLike): number {
  let chars = 0;
  for (const part of message.parts) {
    if (
      typeof part === "object" &&
      part !== null &&
      "type" in part &&
      (part as { type: unknown }).type === "text"
    ) {
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") chars += text.length;
    }
  }
  return Math.ceil(chars / CHARS_PER_TOKEN);
}

/**
 * Approximate total tokens for a list of messages. Used by the
 * client-facing "approaching limit" banner + the server-side
 * trigger threshold check before running compaction.
 */
export function approximateTotalTokens(messages: MessageLike[]): number {
  let total = 0;
  for (const m of messages) total += approximateMessageTokens(m);
  return total;
}

// ---- Draft detection ----
//
// User's observation: the most recent "big" assistant message is our
// canonical draft, regardless of whether it's longer or shorter than
// earlier versions. The rule we landed on:
//
//   "Keep the most recent assistant text-message above a minimum
//    length threshold. Summarize everything else."
//
// Length here filters out coaching replies and short Q&A — those
// don't need to be preserved verbatim, the summary handles their
// gist. The threshold is tunable; 2000 tokens cleanly separates
// paragraph-sized coaching from full-draft-sized output in our
// observed usage.

export const LONG_MESSAGE_TOKEN_THRESHOLD = 2000;

/**
 * Identify the most recent assistant message with enough text to
 * look like a draft. Returns null when nothing in the range qualifies
 * — we just do plain summarization in that case, no special
 * preservation.
 *
 * Operates on a pre-cutoff slice so the caller decides what's "old
 * enough to compact". Assumes messages are ordered oldest-first.
 */
export function findLatestDraftMessage(
  messages: MessageLike[],
): MessageLike | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m) continue;
    if (m.role !== "assistant") continue;
    if (approximateMessageTokens(m) < LONG_MESSAGE_TOKEN_THRESHOLD) continue;
    return m;
  }
  return null;
}

// ---- Compaction thresholds ----
//
// The model context window is 1M tokens. System prompt + rubric +
// tool schemas eat a variable ~5-10k per turn. We warn the user well
// before the wall so they have time to compact without pressure:
//
//   - WARN at 70% (700k) — amber banner invites compaction
//   - BLOCK at 85% (850k) — retry is futile; next turn will fail.
//     The UI's error banner swaps retry for "Comprimeer en probeer
//     opnieuw" when the API returns a context-limit error.
//
// These are approximate budgets; the actual limit is enforced by the
// gateway. We just use them to drive UX.

export const CONTEXT_WARN_TOKEN_THRESHOLD = 700_000;
export const CONTEXT_HARD_TOKEN_THRESHOLD = 1_000_000;
