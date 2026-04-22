// Pure scoring functions. No I/O, no LLM calls, no DB access.
//
// Preserved verbatim in behaviour from apps/web/scripts/corpus/eval-runner.ts.
// If you change a regex or a formula here, you change the matrix noise floor
// and every historical baseline — think twice and re-run the full matrix
// before merging.

import type { ComparisonBreakdown, ScoreBreakdown } from "./types.js";

// ---- Regex / token lists ----

/**
 * ChatGPT-tell phrases that real NWD portfolios almost never contain.
 * Detected case-insensitively, counted with /gi so repeated tells are weighted.
 *
 * When adding new entries: validate against the corpus first by running
 * the matrix with --tag=new-antitell-probe and checking that golden counts
 * stay near zero while generated counts respond. Otherwise you risk marking
 * real kandidaat writing as AI tell.
 */
const ANTI_TELLS: readonly RegExp[] = [
  /\bzorgde voor\b/gi,
  /\bimplementeerde\b/gi,
  /\bfaciliteerde\b/gi,
  /\bborgde\b/gi,
  /\bzorgde ervoor dat\b/gi,
  /\bdit laat zien dat\b/gi,
  /\bhiermee heb ik aangetoond\b/gi,
  /\bop effectieve wijze\b/gi,
  /\bop een gestructureerde manier\b/gi,
  /\bresulteerde in\b/gi,
  /\bcruciaal\b/gi,
  /\bessentieel\b/gi,
];

/**
 * Self-summarising sentence patterns that signal a kandidaat (or LLM)
 * explaining their own bewijs instead of letting it speak. Real portfolios
 * end with the situation, not with a sales pitch.
 */
const META_CODA =
  /\b(dit laat zien dat|hiermee (heb|laat) ik|dit bewijst dat|dit illustreert)\b/gi;

/**
 * NWD- and zeilsport-specific jargon that anchors a sentence in a concrete
 * practice context. Hits here are a strong signal of authentic detail rather
 * than generic writing.
 *
 * Keep in sync with the ingestion pipeline's jargon dictionary. Both sides
 * must agree on which terms count as sport-specific.
 */
const SPORT_JARGON =
  /\b(bft|knopen|gennaker|trapezium|overstag|halve wind|cwo|i[-]?\d|niveau \d|laser|dart|pico|optimist|valk|polyvalk|bakstag|zwaard|grootzeil|fok)\b/gi;

/**
 * Anonymization tokens produced by our scrub pipeline. Each token stands in
 * for a concrete detail (a person, place, date, organisation) and thus
 * signals authentic specificity in a bewijs paragraph.
 */
const ANONYMIZATION_TOKENS = /\[(KANDIDAAT|LOCATIE|VERENIGING|DATUM|PII|ID)\]/g;

/**
 * Inline digits (week numbers, dates, counts). Numbers in bewijs are a strong
 * concreteness signal — "in week 14" beats "tijdens een les".
 */
const NUMBERS = /\b\d+\b/g;

// ---- Primitive scorers ----

/**
 * Word count after whitespace collapse. Matches the definition used across
 * the eval harness since Stage 0.
 */
export function wordCount(s: string): number {
  return s.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;
}

/**
 * Concreteness density: anonymization tokens + digits + sport-jargon hits
 * per 100 words, rounded to one decimal. Returns 0 for empty strings.
 *
 * This is the metric the eval matrix uses as its primary quality axis.
 * Higher = denser concrete detail.
 */
export function concretenessPer100(s: string): number {
  const wc = wordCount(s);
  if (wc === 0) return 0;
  const tokens =
    (s.match(ANONYMIZATION_TOKENS)?.length ?? 0) +
    (s.match(NUMBERS)?.length ?? 0) +
    (s.match(SPORT_JARGON)?.length ?? 0);
  return Math.round((tokens / wc) * 1000) / 10;
}

/**
 * Count of ANTI_TELLS phrase occurrences, summed across all patterns. Higher
 * is worse (more AI-tell).
 */
export function antiTellCount(s: string): number {
  return ANTI_TELLS.reduce((sum, re) => sum + (s.match(re)?.length ?? 0), 0);
}

/**
 * Count of meta-coda sentence patterns. Higher is worse.
 */
export function metaCodaCount(s: string): number {
  return s.match(META_CODA)?.length ?? 0;
}

// ---- Composite scorers ----

/**
 * Full primitive breakdown for one bewijs paragraph. Cheap enough to call
 * per-paragraph; no LLM calls.
 */
export function scoreBewijs(text: string): ScoreBreakdown {
  return {
    wordCount: wordCount(text),
    concretenessPer100: concretenessPer100(text),
    antiTellCount: antiTellCount(text),
    metaCodaCount: metaCodaCount(text),
  };
}

/**
 * Compare a generated bewijs against a golden reference. Produces the
 * primitive breakdown plus two derived ratios used in every matrix report:
 *
 *   - lengthDeltaPct   — percent difference vs golden wc (positive = longer)
 *   - concretenessRatio — generated concreteness as percent of golden
 *                         (100% = parity, higher = denser than golden)
 *
 * Both ratios match the formulas used in eval-runner.ts's aggregation,
 * verified by matrix baselines.
 */
export function compareBewijs(
  generated: string,
  golden: string,
): ComparisonBreakdown {
  const gen = scoreBewijs(generated);
  const gold = scoreBewijs(golden);
  const lengthDeltaPct =
    gold.wordCount === 0
      ? 0
      : Math.round(((gen.wordCount - gold.wordCount) / gold.wordCount) * 1000) /
        10;
  const concretenessRatio =
    gold.concretenessPer100 === 0
      ? 0
      : Math.round((gen.concretenessPer100 / gold.concretenessPer100) * 1000) /
        10;
  return {
    ...gen,
    lengthDeltaPct,
    concretenessRatio,
  };
}
