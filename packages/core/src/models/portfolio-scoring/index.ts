// Portfolio scoring primitives.
//
// Pure functions that quantify bewijs-paragraph quality along four dimensions:
//   - wordCount:         length
//   - concretenessPer100: density of concrete detail (numbers, sport-jargon,
//                         anonymization tokens) per 100 words
//   - antiTellCount:     count of ChatGPT-tell phrases ("zorgde voor", "cruciaal")
//   - metaCodaCount:     count of self-summarising endings ("dit laat zien dat...")
//
// Extracted from apps/web/scripts/corpus/eval-runner.ts so the same scoring
// logic is usable by:
//   - the eval matrix (Stage E noise-floor methodology)
//   - the leercoach (internal self-audit before proposing a bewijs draft)
//   - the portfolio-checker route (user-facing per-criterium scorecard)
//   - the portfolio-review route (reviewer tooling)
//
// The original implementations have NOT changed in behaviour during this
// extraction — eval-runner.ts imports from here, so the matrix noise floor
// measured on 2026-04-19 (+0.6pp length, 0.0 concreteness) still applies.

export * from "./score.js";
export * from "./types.js";
