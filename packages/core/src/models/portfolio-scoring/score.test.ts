// Unit tests for the portfolio scoring primitives.
//
// These tests guard the matrix noise floor. If they change behaviour,
// historical baselines in reports/history.md become incomparable — treat any
// change here as a signal to re-run the full matrix and update baselines.
//
// Run: pnpm -F @nawadi/core test

import assert from "node:assert/strict";
import test from "node:test";
import {
  antiTellCount,
  compareBewijs,
  concretenessPer100,
  metaCodaCount,
  scoreBewijs,
  wordCount,
} from "./score.js";

test("wordCount counts whitespace-separated tokens and ignores collapse", () => {
  assert.equal(wordCount(""), 0);
  assert.equal(wordCount("   "), 0);
  assert.equal(wordCount("hello"), 1);
  assert.equal(wordCount("hello world"), 2);
  assert.equal(wordCount("  hello   world  "), 2);
  assert.equal(wordCount("alpha\nbeta\tgamma"), 3);
});

test("concretenessPer100 returns 0 for empty text", () => {
  assert.equal(concretenessPer100(""), 0);
  assert.equal(concretenessPer100("   "), 0);
});

test("concretenessPer100 counts anonymization tokens", () => {
  // 5 words, 1 token → 1/5 = 20 per 100
  assert.equal(concretenessPer100("Ik gaf les aan [KANDIDAAT]"), 20);
  // All 6 token types (12 total words: 6 tokens + 6 connectors)
  const allTokens = "ik [KANDIDAAT] bij [LOCATIE] met [VERENIGING] op [DATUM] over [PII] en [ID]";
  const wc = wordCount(allTokens);
  assert.equal(wc, 12);
  // 6 tokens / 12 words * 100 = 50 per 100
  assert.equal(concretenessPer100(allTokens), 50);
});

test("concretenessPer100 counts digits as concrete markers", () => {
  // "in week 14" — 3 words, 1 digit-token = 33.3 per 100
  assert.equal(concretenessPer100("in week 14"), 33.3);
  // Multiple digits: "7 tot 9 jaar" — 4 words, 2 digits → 50 per 100
  assert.equal(concretenessPer100("7 tot 9 jaar"), 50);
});

test("concretenessPer100 counts sport jargon hits", () => {
  // "ik zeilde met een laser op 4 bft" — 8 words; "laser", "4", "bft" = 3 tokens
  assert.equal(concretenessPer100("ik zeilde met een laser op 4 bft"), 37.5);
  // No jargon, no numbers → 0
  assert.equal(concretenessPer100("ik ging naar buiten om te kijken"), 0);
});

test("concretenessPer100 is case-insensitive on sport jargon but preserves token literals", () => {
  // [KANDIDAAT] token in mixed case is NOT a match (tokens are literal)
  assert.equal(concretenessPer100("ik met [kandidaat]"), 0); // token is lowercase, doesn't match
  assert.ok(concretenessPer100("ik met [KANDIDAAT]") > 0);
  // Sport jargon IS case-insensitive
  assert.ok(concretenessPer100("overstag gaan") > 0);
  assert.ok(concretenessPer100("OVERSTAG gaan") > 0);
});

test("antiTellCount catches canonical ChatGPT tells", () => {
  assert.equal(antiTellCount(""), 0);
  assert.equal(antiTellCount("ik ging zeilen"), 0);
  assert.equal(antiTellCount("ik zorgde voor structuur"), 1);
  assert.equal(antiTellCount("dit is cruciaal en essentieel"), 2);
  // Multiple occurrences count
  assert.equal(
    antiTellCount("ik zorgde voor X en ik zorgde voor Y en dit was cruciaal"),
    3,
  );
});

test("antiTellCount is case-insensitive", () => {
  assert.equal(antiTellCount("Zorgde voor"), 1);
  assert.equal(antiTellCount("ZORGDE VOOR"), 1);
});

test("metaCodaCount detects meta-summarising sentence endings", () => {
  assert.equal(metaCodaCount(""), 0);
  assert.equal(metaCodaCount("ik gaf goede les"), 0);
  assert.equal(metaCodaCount("dit laat zien dat ik dit kan"), 1);
  assert.equal(metaCodaCount("hiermee heb ik aangetoond"), 1);
  assert.equal(metaCodaCount("hiermee laat ik zien"), 1);
  assert.equal(metaCodaCount("dit bewijst dat ik het kan"), 1);
  assert.equal(metaCodaCount("dit illustreert mijn punt"), 1);
});

test("scoreBewijs returns all four primitives in one call", () => {
  const s = "In week 14 zorgde ik voor een goede les met [KANDIDAAT]. Dit laat zien dat ik het kan.";
  const score = scoreBewijs(s);
  assert.ok(score.wordCount > 0);
  assert.ok(score.concretenessPer100 > 0);
  assert.ok(score.antiTellCount >= 1); // "zorgde" tell
  assert.ok(score.metaCodaCount >= 1); // "dit laat zien dat"
});

test("compareBewijs reports length delta and concreteness ratio", () => {
  const golden = "In week 14 zeilde ik met [KANDIDAAT] op het [LOCATIE]."; // 9 words, dense
  const generated = "Ik heb gezeild met iemand op een plek."; // 8 words, no concrete tokens
  const result = compareBewijs(generated, golden);

  // Generated is shorter: expected ~-11% delta
  assert.ok(result.lengthDeltaPct < 0);
  assert.ok(result.lengthDeltaPct >= -20);

  // Generated has 0 concreteness → ratio is 0
  assert.equal(result.concretenessRatio, 0);
});

test("compareBewijs handles empty golden gracefully", () => {
  const result = compareBewijs("some text with [KANDIDAAT]", "");
  assert.equal(result.lengthDeltaPct, 0);
  assert.equal(result.concretenessRatio, 0);
});

test("compareBewijs reports parity when generated matches golden exactly", () => {
  const txt = "In week 14 zeilde ik met [KANDIDAAT]";
  const result = compareBewijs(txt, txt);
  assert.equal(result.lengthDeltaPct, 0);
  assert.equal(result.concretenessRatio, 100);
});
