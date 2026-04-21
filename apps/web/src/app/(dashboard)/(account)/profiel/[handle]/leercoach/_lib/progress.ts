// Heuristic progress detection from chat messages.
//
// The leercoach is instructed (in the system prompt) to render its
// concept paragraphs as markdown blockquotes with a specific header:
//
//   > **Concept — werkproces {N.N.N}, criterium {X}**
//   >
//   > {paragraph body}
//
// This module scans assistant message text for those headers to build
// a structural map of "what's been drafted" per werkproces + criterium,
// plus a looser "has this werkproces come up at all" flag driven by
// any mention of its dotted code ("5.3.1") in user OR assistant turns.
//
// Intentionally heuristic — false negatives (missing a draft) are
// acceptable for v1 because the purpose is to give the kandidaat an
// overview, not a gradebook. False positives (flagging undrafted
// werkprocessen as drafted) are worse because they'd mislead; the
// patterns below are strict substring/regex matches on model-produced
// markers so accidental mentions don't trip the "drafted" flag.

import type { LeercoachWerkproces } from "./rubric";

export type WerkprocesProgress = {
  /** Werkproces.id */
  werkprocesId: string;
  /** Parsed display code, e.g. "5.3.1". Null when titel didn't parse. */
  code: string | null;
  /** True when code appears anywhere in assistant or user text. */
  mentioned: boolean;
  /** Count of `> **Concept — werkproces {code}` blockquotes in assistant text. */
  conceptCount: number;
  /** Set of criterium rangs that have at least one Concept blockquote for this werkproces. */
  draftedCriteria: Set<number>;
};

export type ProgressMap = Map<string, WerkprocesProgress>;

export type ChatMessageLike = {
  role: "user" | "assistant" | "system" | string;
  parts: unknown[];
};

// Concept blockquote header produced by the model. Tolerates:
//   - Bold delimiters ** or __
//   - Various em-dash variants (— – -)
//   - Capitalisation on "Concept" (model occasionally drops caps)
//   - Whitespace slop around separators
//
// Captured groups:
//   1. werkprocesCode (dotted, e.g. 5.3.1)
//   2. criteriumRang (integer)
const CONCEPT_HEADER_PATTERN =
  />\s*\*{1,2}\s*concept\s*[-–—]\s*werkproces\s+(\d+(?:\.\d+)+)\s*,\s*criteri(?:um|a)\s+(\d+)\s*\*{1,2}/gi;

function extractText(parts: unknown[]): string {
  const chunks: string[] = [];
  for (const part of parts) {
    if (
      typeof part === "object" &&
      part !== null &&
      "type" in part &&
      (part as { type: unknown }).type === "text" &&
      "text" in part &&
      typeof (part as { text: unknown }).text === "string"
    ) {
      chunks.push((part as { text: string }).text);
    }
  }
  return chunks.join("\n");
}

/**
 * Scan all messages once per drawer-open and compute progress per
 * werkproces. Returns a Map keyed by werkprocesId so the UI can
 * look up status in O(1) while rendering the rubric tree.
 *
 * The scan is O(messages × codes) with short-circuiting via a joined
 * regex, so a chat of ~200 turns against a 12-werkproces rubric is
 * sub-millisecond — no memoisation needed for v1.
 */
export function computeProgress(input: {
  messages: ChatMessageLike[];
  werkprocessen: LeercoachWerkproces[];
  /** Parser that extracts a display code from werkproces.titel. */
  parseCode: (titel: string) => { code: string | null };
}): ProgressMap {
  const progress: ProgressMap = new Map();
  for (const wp of input.werkprocessen) {
    progress.set(wp.id, {
      werkprocesId: wp.id,
      code: input.parseCode(wp.titel).code,
      mentioned: false,
      conceptCount: 0,
      draftedCriteria: new Set<number>(),
    });
  }

  // Build a code → id index for concept-header attribution.
  const byCode = new Map<string, string>();
  for (const entry of progress.values()) {
    if (entry.code) byCode.set(entry.code, entry.werkprocesId);
  }

  for (const message of input.messages) {
    const text = extractText(message.parts);
    if (!text) continue;

    // Mention detection: any werkproces code appearing in either
    // user or assistant text. Skips system messages.
    if (message.role === "user" || message.role === "assistant") {
      for (const entry of progress.values()) {
        if (!entry.code || entry.mentioned) continue;
        // Word-boundary-ish: the code is surrounded by non-digit-or-dot
        // chars so "5.3.1" isn't matched as part of "5.3.10". Simple
        // regex, cached per code would be faster but premature for v1.
        const pattern = new RegExp(
          `(^|[^0-9.])${escapeRegex(entry.code)}(?![0-9.])`,
          "",
        );
        if (pattern.test(text)) entry.mentioned = true;
      }
    }

    // Concept-header detection: assistant-only, and strict pattern
    // so we don't flag a user typing the phrase back.
    if (message.role !== "assistant") continue;
    // Reset lastIndex defensively since the regex is stateful (/g).
    CONCEPT_HEADER_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null = CONCEPT_HEADER_PATTERN.exec(text);
    while (m) {
      const code = m[1];
      const rang = m[2];
      if (code && rang) {
        const id = byCode.get(code);
        if (id) {
          const entry = progress.get(id);
          if (entry) {
            entry.conceptCount += 1;
            entry.mentioned = true;
            const n = Number.parseInt(rang, 10);
            if (Number.isFinite(n)) entry.draftedCriteria.add(n);
          }
        }
      }
      m = CONCEPT_HEADER_PATTERN.exec(text);
    }
  }

  return progress;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
