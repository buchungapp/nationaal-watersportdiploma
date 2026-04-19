// Pure-function tests for the sandbox prompt builders and text serialisers.
// Run with: `pnpm test:sandbox` (uses node --test with native TypeScript).
//
// We intentionally avoid importing from `./rubric` or anything that pulls in
// the Next.js server stack, so these tests stay cheap and can stay in the same
// folder as the code they test.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  type AnswerInput,
  buildDraftPrompt,
  buildQuestionsPrompt,
  draftToPlainText,
  werkprocesToPlainText,
} from "./prompts.ts";
import type { Question, WerkprocesDraft } from "./schemas.ts";
import type { RubricTree } from "./types.ts";

const WP1 = "11111111-1111-1111-1111-111111111111";
const WP2 = "22222222-2222-2222-2222-222222222222";
const KT = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const C1 = "cccccccc-cccc-cccc-cccc-cccccccccc01";
const C2 = "cccccccc-cccc-cccc-cccc-cccccccccc02";
const C3 = "cccccccc-cccc-cccc-cccc-cccccccccc03";

const TREE: RubricTree = {
  profielId: "11111111-aaaa-bbbb-cccc-ddddeeeeffff",
  profielTitel: "Instructeur 3",
  richting: "instructeur",
  niveauRang: 3,
  werkprocessen: [
    {
      id: WP1,
      kerntaakId: KT,
      titel: "Geven van lessen",
      resultaat: "De les draagt bij aan de ontwikkeling van de cursist.",
      rang: 1,
      criteria: [
        {
          id: C1,
          title: "Stelt zich open op",
          omschrijving: "Houdt contact met alle cursisten.",
          rang: 1,
        },
        {
          id: C2,
          title: "Differentieert",
          omschrijving: "Past het lesaanbod aan per cursist.",
          rang: 2,
        },
      ],
    },
    {
      id: WP2,
      kerntaakId: KT,
      titel: "Evalueert en reflecteert",
      resultaat: "Inzicht in eigen handelen.",
      rang: 2,
      criteria: [
        {
          id: C3,
          title: "Reflecteert op eigen lessen",
          omschrijving: "Benoemt eigen sterke en zwakke punten.",
          rang: 1,
        },
      ],
    },
  ],
};

describe("buildQuestionsPrompt", () => {
  it("includes every werkproces and criterium by id", () => {
    const { system, user } = buildQuestionsPrompt(TREE);

    assert.match(system, /Instructeur niveau 3/);
    assert.match(system, /SCHRIJFSTIJL/);
    assert.match(user, new RegExp(WP1));
    assert.match(user, new RegExp(WP2));
    assert.match(user, new RegExp(C1));
    assert.match(user, new RegExp(C2));
    assert.match(user, new RegExp(C3));
    assert.match(user, /Geven van lessen/);
    assert.match(user, /Evalueert en reflecteert/);
  });

  it("never introduces an em-dash in the rubric rendering", () => {
    const { user } = buildQuestionsPrompt(TREE);
    assert.equal(
      user.includes("—"),
      false,
      "User prompt contained an em-dash, which the schrijfstijl explicitly forbids.",
    );
  });

  it("labels the richting consistently", () => {
    const lc: RubricTree = { ...TREE, richting: "leercoach", niveauRang: 4 };
    const pvb: RubricTree = {
      ...TREE,
      richting: "pvb_beoordelaar",
      niveauRang: 4,
    };
    assert.match(buildQuestionsPrompt(lc).system, /Leercoach niveau 4/);
    assert.match(buildQuestionsPrompt(pvb).system, /PvB-beoordelaar niveau 4/);
  });
});

describe("buildDraftPrompt", () => {
  const questions: Question[] = [
    {
      id: "q-1",
      werkprocesId: WP1,
      werkprocesTitel: "Geven van lessen",
      criteriumIds: [C1],
      prompt: "Beschrijf een les waar je contact hield met alle cursisten.",
    },
    {
      id: "q-2",
      werkprocesId: WP2,
      werkprocesTitel: "Evalueert en reflecteert",
      criteriumIds: [C3],
      prompt: "Beschrijf hoe je een zwak lesmoment hebt geanalyseerd.",
    },
  ];
  const q1 = questions[0];
  const q2 = questions[1];
  if (!q1 || !q2) throw new Error("Test setup: questions array shrank");
  const answers: AnswerInput[] = [
    {
      questionId: "q-1",
      werkprocesId: WP1,
      criteriumIds: [C1],
      prompt: q1.prompt,
      answer:
        "Bij het eerste uur op het water had ik een groep van zes cursisten...",
    },
    {
      questionId: "q-2",
      werkprocesId: WP2,
      criteriumIds: [C3],
      prompt: q2.prompt,
      answer: "Na een les waar cursisten afhaakten heb ik opgeschreven wat...",
    },
  ];

  it("throws when the werkproces isn't in the tree", () => {
    assert.throws(
      () =>
        buildDraftPrompt({
          tree: TREE,
          werkprocesId: "ffffffff-ffff-ffff-ffff-ffffffffffff",
          answers,
          questions,
        }),
      /niet gevonden/,
    );
  });

  it("scopes direct answers to the target werkproces but includes others as context", () => {
    const { user } = buildDraftPrompt({
      tree: TREE,
      werkprocesId: WP1,
      answers,
      questions,
    });
    // Direct answer for WP1 appears in the "direct" block.
    assert.match(user, /Bij het eerste uur op het water/);
    // WP2 answer appears as context, not as a direct answer.
    assert.match(user, /Overige antwoorden van de kandidaat/);
    assert.match(user, /Na een les waar cursisten afhaakten/);
  });

  it("falls back cleanly when the target werkproces has no direct answers", () => {
    const a2 = answers[1];
    if (!a2) throw new Error("Test setup: answers array shrank");
    const onlyWp2Answers = [a2];
    const { user } = buildDraftPrompt({
      tree: TREE,
      werkprocesId: WP1,
      answers: onlyWp2Answers,
      questions,
    });
    assert.match(
      user,
      /\(geen directe antwoorden; baseer je op de context hieronder\)/,
    );
  });

  it("injects the few-shot fragment into the draft system prompt", () => {
    const { system } = buildDraftPrompt({
      tree: TREE,
      werkprocesId: WP1,
      answers,
      questions,
    });
    // The fragment header announces three examples from real portfolios.
    assert.match(
      system,
      /drie voorbeelden van echte, geanonimiseerde bewijs-paragrafen/,
    );
    assert.match(system, /VOORBEELD 1/);
    assert.match(system, /VOORBEELD 2/);
    assert.match(system, /VOORBEELD 3/);
    // Anti-meta-coda rule must survive the merge.
    assert.match(system, /Geen meta-coda/);
    // Sanity: no raw first names, ID numbers, or obvious location slipped in.
    const BAD_PATTERNS = [
      /\bNiels\b/,
      /\bMarjolein\b/,
      /\b12064403\b/,
      /\bJade Swanenburg\b/,
    ];
    for (const re of BAD_PATTERNS) {
      assert.equal(
        re.test(system),
        false,
        `Few-shot fragment leaked ${re}. Re-run scripts/corpus/pick-fewshot.ts or tighten the polish pass.`,
      );
    }
  });

  describe("retrievalMode = 'fewshot'", () => {
    const SRC = "seed:experiment#wp1";
    const retrieved = new Map([
      [
        C1,
        [
          {
            content:
              "In week 14 had ik een groep van vier cursisten op de Laser Pico. Eén cursist was duidelijk boven het groepsniveau, dus liet ik haar een eigen traject uitvoeren terwijl ik de andere drie begeleidde op de basishandelingen.",
            wordCount: 42,
            qualityScore: 3.5,
            sourceIdentifier: SRC,
          },
        ],
      ],
      [
        C2,
        [
          {
            content:
              "Tijdens de SBF-week in week 22 heb ik per dag de voortgang bijgehouden in een tabel en per cursist genoteerd welke specifieke eisen nog openstonden, zodat ik de volgende lesdag gericht kon inzoomen.",
            wordCount: 38,
            qualityScore: 2.8,
            sourceIdentifier: SRC,
          },
        ],
      ],
    ]);

    it("replaces the static few-shot with retrieved chunks when mode=fewshot", () => {
      const { system, user } = buildDraftPrompt({
        tree: TREE,
        werkprocesId: WP1,
        answers,
        questions,
        retrievedChunks: retrieved,
        retrievalMode: "fewshot",
      });
      // Retrieved chunk content must show up in the SYSTEM prompt's few-shot slot.
      assert.match(system, /In week 14 had ik een groep van vier cursisten/);
      assert.match(system, /Tijdens de SBF-week in week 22/);
      // Source identifier surfaces as the example's bron label.
      assert.match(system, /bron: seed:experiment#wp1/);
      // The user-prompt inspiration block MUST be suppressed — the chunks are
      // in the system prompt now and duplicating them would swamp the context.
      assert.equal(
        /Inspiratie uit echte portfolio's/.test(user),
        false,
        "Inspiration block should be suppressed when retrievalMode=fewshot.",
      );
      assert.equal(
        /STIJL-ANKER/.test(user),
        false,
        "Loose-framing inspiration header should also be suppressed.",
      );
    });

    it("pads with hand-picked FEW_SHOT_EXAMPLES when retrieval returns fewer than 3", () => {
      const onlyOne = new Map([[C1, retrieved.get(C1) ?? []]]);
      const { system } = buildDraftPrompt({
        tree: TREE,
        werkprocesId: WP1,
        answers,
        questions,
        retrievedChunks: onlyOne,
        retrievalMode: "fewshot",
      });
      // Retrieved chunk appears.
      assert.match(system, /In week 14 had ik een groep van vier cursisten/);
      // Static few-shot padding kicks in for the remaining slots — look for a
      // signature phrase from FEW_SHOT_EXAMPLES that's stable across edits.
      assert.match(system, /VOORBEELD 2/);
      assert.match(system, /VOORBEELD 3/);
    });

    it("falls back to static few-shot when retrieval returns nothing", () => {
      const { system } = buildDraftPrompt({
        tree: TREE,
        werkprocesId: WP1,
        answers,
        questions,
        retrievedChunks: new Map(),
        retrievalMode: "fewshot",
      });
      // Static few-shot examples should be fully present.
      assert.match(system, /VOORBEELD 1/);
      assert.match(system, /VOORBEELD 3/);
    });

    it("leaves the inspiration block intact when mode=inspiration (default)", () => {
      const { user } = buildDraftPrompt({
        tree: TREE,
        werkprocesId: WP1,
        answers,
        questions,
        retrievedChunks: retrieved,
        // mode not set → defaults to inspiration
      });
      assert.match(user, /Inspiratie uit echte portfolio's/);
      assert.match(user, /In week 14 had ik een groep van vier cursisten/);
    });
  });
});

describe("draftToPlainText / werkprocesToPlainText", () => {
  const draft: WerkprocesDraft[] = [
    {
      werkprocesId: WP2,
      werkprocesTitel: "Evalueert en reflecteert",
      criteria: [
        {
          criteriumId: C3,
          criteriumTitel: "Reflecteert op eigen lessen",
          bewijs: "Na elke les schrijf ik op wat werkte en wat niet...",
        },
      ],
    },
    {
      werkprocesId: WP1,
      werkprocesTitel: "Geven van lessen",
      criteria: [
        {
          criteriumId: C1,
          criteriumTitel: "Stelt zich open op",
          bewijs: "Bij aanvang van elke les controleer ik of iedereen...",
        },
      ],
    },
  ];

  it("serialises every werkproces + criterium", () => {
    const text = draftToPlainText(draft, "Instructeur 3");
    assert.match(text, /# Portfolio Instructeur 3/);
    assert.match(text, /## Geven van lessen/);
    assert.match(text, /## Evalueert en reflecteert/);
    assert.match(text, /### Stelt zich open op/);
    assert.match(text, /### Reflecteert op eigen lessen/);
    assert.match(text, /Bij aanvang van elke les/);
    assert.match(text, /Na elke les schrijf ik op/);
  });

  it("orders werkprocessen alphabetically for a stable clipboard payload", () => {
    const text = draftToPlainText(draft, "Instructeur 3");
    const idxEval = text.indexOf("## Evalueert en reflecteert");
    const idxLessen = text.indexOf("## Geven van lessen");
    assert.ok(idxEval >= 0 && idxLessen >= 0);
    assert.ok(
      idxEval < idxLessen,
      "Evalueert (E) should sort before Geven (G) via localeCompare",
    );
  });

  it("werkprocesToPlainText renders a single block", () => {
    const first = draft[0];
    if (!first) throw new Error("Test setup: draft array empty");
    const text = werkprocesToPlainText(first);
    assert.match(text, /^## Evalueert en reflecteert/);
    assert.match(text, /### Reflecteert op eigen lessen/);
    assert.match(text, /Na elke les/);
  });
});
