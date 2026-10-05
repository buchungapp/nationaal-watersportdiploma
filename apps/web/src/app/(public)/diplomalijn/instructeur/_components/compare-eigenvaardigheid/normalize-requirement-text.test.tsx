// Deliberately corrupted input fixtures.
// cspell:words effici œvarenâ
import { describe, expect, it } from "vitest";
import { normalizeRequirementText } from "./normalize-requirement-text";

describe("normalizeRequirementText", () => {
  it.each([
    "Vaart 5–6 knopen (??)",
    "Wind — richting (??)",
    "Koers ‘noord’ met �",
    "⛵ (??)",
  ])("preserves valid Unicode in %s", (text) => {
    expect(normalizeRequirementText(text)).toBe(text);
  });

  it.each([
    ["efficiÃ«nt", "efficiënt"],
    ["efficiÃ«nt – varen", "efficiënt – varen"],
    ["Vaart 5â€“6 knopen", "Vaart 5–6 knopen"],
    ["Wind â€” richting", "Wind — richting"],
    ["â€œvarenâ€\u009d", '"varen"'],
    ["effici??nt", "efficiënt"],
  ])("repairs %s", (input, expected) => {
    expect(normalizeRequirementText(input)).toBe(expected);
  });

  it("preserves missing requirements", () => {
    expect(normalizeRequirementText(null)).toBeNull();
    expect(normalizeRequirementText("")).toBe("");
  });
});
