// Types for the portfolio scoring engine.
//
// A ScoreBreakdown carries all four primitive scores plus the derived
// concreteness ratio (if a golden reference was provided) for one bewijs
// paragraph. The UI can render any subset; the engine doesn't dictate.

export type ScoreBreakdown = {
  wordCount: number;
  concretenessPer100: number;
  antiTellCount: number;
  metaCodaCount: number;
};

export type ComparisonBreakdown = ScoreBreakdown & {
  /**
   * Generated wc as percent delta vs golden. Positive = longer than golden.
   */
  lengthDeltaPct: number;
  /**
   * Generated concreteness as percent of golden. 100% = parity.
   */
  concretenessRatio: number;
};
