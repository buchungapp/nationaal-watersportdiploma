// Pure-function tests for the thin-answer gate helpers. The LLM-calling
// orchestration (runThinAnswerGate) is covered by the eval harness end-to-end;
// here we only test the deterministic bits.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldExpand, truncateAnswersToWords } from "./thin-answer-gate.ts";
import type { AnswerGrade } from "./thin-answer-gate.ts";

function mockGrade(overrides: Partial<AnswerGrade>): AnswerGrade {
  return {
    questionId: "q1",
    answerWordCount: 30,
    heuristicThin: false,
    llmNeedsExpansion: false,
    concretenessEstimate: "gemengd",
    missingAngle: null,
    followUpPrompt: null,
    ...overrides,
  };
}

describe("truncateAnswersToWords", () => {
  it("truncates long answers to exactly N words", () => {
    const answers = [
      {
        questionId: "q1",
        answer:
          "In week 14 begeleidde ik een groep van zes cursisten op de Laser Pico en een van hen had duidelijk meer ervaring dan de anderen.",
      },
    ];
    const out = truncateAnswersToWords(answers, 10);
    assert.equal(out.length, 1);
    const firstOut = out[0];
    if (!firstOut) throw new Error("Output array shrank");
    const words = firstOut.answer.trim().split(/\s+/).filter(Boolean);
    assert.equal(words.length, 10);
    assert.match(firstOut.answer, /^In week 14 begeleidde ik een groep van zes/);
  });

  it("leaves short answers unchanged", () => {
    const answers = [{ questionId: "q1", answer: "Korte zin." }];
    const out = truncateAnswersToWords(answers, 30);
    assert.equal(out[0]?.answer, "Korte zin.");
  });

  it("handles the edge case of an exactly-N-word answer", () => {
    const sentence = "een twee drie vier vijf zes zeven acht negen tien";
    const answers = [{ questionId: "q1", answer: sentence }];
    const out = truncateAnswersToWords(answers, 10);
    assert.equal(out[0]?.answer, sentence);
  });

  it("preserves questionId ordering and identity", () => {
    const answers = [
      { questionId: "q1", answer: "one two three four five six seven eight nine ten" },
      { questionId: "q2", answer: "short" },
      { questionId: "q3", answer: "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda" },
    ];
    const out = truncateAnswersToWords(answers, 5);
    assert.deepEqual(
      out.map((a) => a.questionId),
      ["q1", "q2", "q3"],
    );
    assert.equal(out[0]?.answer, "one two three four five");
    assert.equal(out[1]?.answer, "short");
    assert.equal(out[2]?.answer, "alpha beta gamma delta epsilon");
  });

  it("collapses irregular whitespace cleanly on truncation", () => {
    const answers = [
      {
        questionId: "q1",
        answer:
          "  alpha   beta\t\tgamma\ndelta     epsilon   zeta   eta   theta ",
      },
    ];
    const out = truncateAnswersToWords(answers, 4);
    assert.equal(out[0]?.answer, "alpha beta gamma delta");
  });
});

describe("shouldExpand policy", () => {
  it("expands when LLM flags AND heuristic is thin", () => {
    assert.equal(
      shouldExpand(
        mockGrade({
          llmNeedsExpansion: true,
          heuristicThin: true,
          concretenessEstimate: "gemengd",
        }),
      ),
      true,
    );
  });

  it("expands when LLM flags AND concreteness is dun (even if not heuristic-thin)", () => {
    assert.equal(
      shouldExpand(
        mockGrade({
          llmNeedsExpansion: true,
          heuristicThin: false,
          concretenessEstimate: "dun",
        }),
      ),
      true,
    );
  });

  it("expands when LLM flags AND concreteness is leeg", () => {
    assert.equal(
      shouldExpand(
        mockGrade({
          llmNeedsExpansion: true,
          heuristicThin: false,
          concretenessEstimate: "leeg",
        }),
      ),
      true,
    );
  });

  it("does NOT expand when LLM flags alone (long, generic answer)", () => {
    // Long, generic answer — LLM flags but heuristic says "not thin"
    // and concreteness is "gemengd". The policy should defer to the heuristic
    // to avoid over-expanding long-but-generic answers that may already
    // contain enough material for the generator.
    assert.equal(
      shouldExpand(
        mockGrade({
          llmNeedsExpansion: true,
          heuristicThin: false,
          concretenessEstimate: "gemengd",
        }),
      ),
      false,
    );
  });

  it("does NOT expand when LLM says OK, even if heuristic thin (short-but-tight)", () => {
    // Short-but-tight answer: 40 well-chosen words with situation + action +
    // outcome. LLM trusts the content; policy respects that over the
    // heuristic word-count trigger.
    assert.equal(
      shouldExpand(
        mockGrade({
          llmNeedsExpansion: false,
          heuristicThin: true,
          concretenessEstimate: "dicht",
        }),
      ),
      false,
    );
  });

  it("does NOT expand when the answer is already dicht", () => {
    assert.equal(
      shouldExpand(
        mockGrade({
          llmNeedsExpansion: false,
          heuristicThin: false,
          concretenessEstimate: "dicht",
        }),
      ),
      false,
    );
  });
});
