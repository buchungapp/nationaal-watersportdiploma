// Thin-answer gate (pre-draft).
//
// Problem: draft quality is bounded by answer quality. A kandidaat who wrote
// 30 words on a criterium can't plausibly produce 150 words of concrete bewijs
// without the generator either hallucinating or padding. Today we send every
// answer to the draft stage unfiltered, so short answers silently produce
// weak bewijs.
//
// Gate design:
//   1. Grade each answer on length + concreteness cheaply (heuristic) and with
//      an LLM classifier (needsExpansion + targeted followUp).
//   2. For answers flagged thin, run an expansion call: "given this short
//      answer and this follow-up question, what's a plausible expanded
//      answer a motivated kandidaat would give?" In production the LLM-
//      crafted followUp is shown to the real candidate; in eval we simulate
//      the expanded answer to measure recovery vs baseline.
//   3. Merge expanded-where-needed into a uniform answer set, ready for
//      runDraftGeneration.
//
// Not yet wired into actions.ts. Used by eval-runner.ts so the matrix can
// measure whether the gate improves draft quality. Graduates to the sandbox
// route only after matrix shows a win.

import { gateway } from "@ai-sdk/gateway";
import { generateObject } from "ai";
import { z } from "zod";
import { MODEL_ID } from "./generator.ts";
import type { Question } from "./schemas.ts";
import type { RubricTree } from "./types.ts";

// ---- Types ----

export type RawAnswer = { questionId: string; answer: string };

export type AnswerGrade = {
  questionId: string;
  answerWordCount: number;
  heuristicThin: boolean;
  llmNeedsExpansion: boolean;
  concretenessEstimate: "leeg" | "dun" | "gemengd" | "dicht";
  missingAngle: string | null;
  followUpPrompt: string | null;
};

export type ExpandedAnswer = {
  questionId: string;
  originalAnswer: string;
  expandedAnswer: string;
  expansionReason: string;
};

export type ThinGateResult = {
  grades: AnswerGrade[];
  expansions: ExpandedAnswer[];
  /** Final answer set ready for draft generation. */
  augmentedAnswers: RawAnswer[];
  stats: {
    totalAnswers: number;
    heuristicThinCount: number;
    llmFlaggedCount: number;
    expandedCount: number;
    gradeMs: number;
    expandMs: number;
  };
};

// ---- Heuristic ----

const HEURISTIC_MIN_WORDS = 50;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ---- LLM grading ----

const GradeSchema = z.object({
  grades: z.array(
    z.object({
      questionId: z.string(),
      needsExpansion: z
        .boolean()
        .describe(
          "True als het antwoord te dun is om een geloofwaardig bewijs-paragraaf op te baseren. Een antwoord is dun als het geen concrete situatie, actie en resultaat bevat, of als het minder dan drie specifieke details noemt (bijv. week/datum, cursisten-situatie, interventie, gevolg).",
        ),
      concretenessEstimate: z.enum(["leeg", "dun", "gemengd", "dicht"]),
      missingAngle: z
        .string()
        .nullable()
        .describe(
          "Als needsExpansion=true: één zin die beschrijft welk STAR-element of welke concreetheid ontbreekt. Null wanneer het antwoord voldoende is.",
        ),
      followUpPrompt: z
        .string()
        .nullable()
        .describe(
          "Als needsExpansion=true: een open, gerichte vervolgvraag aan de kandidaat die precies het ontbrekende stuk uitlokt. Verwijs naar iets dat ze al genoemd hebben. Null wanneer het antwoord voldoende is.",
        ),
    }),
  ),
});

async function gradeAnswersWithLLM(args: {
  questions: Question[];
  answers: RawAnswer[];
  tree: RubricTree;
}): Promise<AnswerGrade[]> {
  const questionById = new Map(args.questions.map((q) => [q.id, q]));
  const gradeInput = args.answers.map((a) => {
    const q = questionById.get(a.questionId);
    return {
      questionId: a.questionId,
      werkprocesTitel: q?.werkprocesTitel ?? "",
      prompt: q?.prompt ?? "(vraag niet gevonden)",
      answer: a.answer,
      answerWordCount: wordCount(a.answer),
    };
  });

  const { object } = await generateObject({
    model: gateway(MODEL_ID),
    schema: GradeSchema,
    system: `Je bent een beoordelaar die antwoorden van PvB-kandidaten classificeert voordat ze naar een bewijs-generator gaan. Je taak is NIET om het bewijs te schrijven; je enige taak is om per antwoord te bepalen of er voldoende concreet materiaal is (situatie, taak, actie, resultaat, specifieke details) om een geloofwaardig bewijs-paragraaf op te baseren.

Een antwoord is "dicht" als het 2+ specifieke details bevat (bijv. week-nummer, cursist-naam/-archetype, bootsoort, wind/zeilconditie, aantal, locatie) EN minstens één concrete actie én resultaat.

Een antwoord is "dun" als het generiek is, niet verwijst naar een specifieke situatie, of essentiële STAR-elementen mist.

Een antwoord is "leeg" als het geen relevante inhoud bevat.

Voor elk antwoord dat je als dun of leeg classificeert, formuleer je een korte, open vervolgvraag die precies het ontbrekende stuk uitlokt — verwijs waar mogelijk naar iets wat de kandidaat al heeft genoemd. Geen multiple-choice, geen ja/nee, geen "zou je meer willen zeggen".

Schrijf de follow-up in het Nederlands, in de ik-vorm alsof je de kandidaat direct aanspreekt. Geen em-dashes.

Rubric context: ${args.tree.profielTitel} (${args.tree.richting} niveau ${args.tree.niveauRang}).`,
    prompt: `Classificeer de volgende ${gradeInput.length} antwoorden:

${gradeInput
  .map(
    (g) =>
      `questionId: ${g.questionId}
werkproces: ${g.werkprocesTitel}
vraag: ${g.prompt}
antwoord (${g.answerWordCount} woorden):
"${g.answer}"`,
  )
  .join("\n\n---\n\n")}

Geef per questionId één oordeel terug. Gebruik de questionIds exact zoals hierboven.`,
    temperature: 0.2,
  });

  const judgedById = new Map(
    object.grades.map((g) => [g.questionId, g] as const),
  );
  return args.answers.map((a) => {
    const judged = judgedById.get(a.questionId);
    const wc = wordCount(a.answer);
    return {
      questionId: a.questionId,
      answerWordCount: wc,
      heuristicThin: wc < HEURISTIC_MIN_WORDS,
      llmNeedsExpansion: judged?.needsExpansion ?? false,
      concretenessEstimate: judged?.concretenessEstimate ?? "gemengd",
      missingAngle: judged?.missingAngle ?? null,
      followUpPrompt: judged?.followUpPrompt ?? null,
    };
  });
}

// ---- LLM expansion (simulate engaged-candidate follow-up) ----

const ExpansionSchema = z.object({
  expandedAnswer: z
    .string()
    .describe(
      "Het volledige antwoord van de kandidaat NA de follow-up. Behoud het oorspronkelijke antwoord waar mogelijk, vul aan met concrete details die het ontbrekende stuk adresseren. Spreek als de kandidaat (ik-vorm, verleden tijd).",
    ),
});

async function expandAnswer(args: {
  question: Question;
  originalAnswer: string;
  grade: AnswerGrade;
  tree: RubricTree;
}): Promise<string> {
  const { question, originalAnswer, grade } = args;
  const followUp = grade.followUpPrompt ?? "Kun je daar een concreet voorbeeld bij geven?";
  const missing = grade.missingAngle ?? "meer concreetheid";

  const { object } = await generateObject({
    model: gateway(MODEL_ID),
    schema: ExpansionSchema,
    system: `Je simuleert een gemotiveerde PvB-kandidaat die een vervolgvraag beantwoordt. De kandidaat heeft al een antwoord gegeven (zie onder) dat door een beoordelaar als te dun werd aangemerkt. De beoordelaar heeft een gerichte vervolgvraag gesteld.

Jouw taak: produceer het UITGEBREIDE antwoord van de kandidaat. Dit is wat de kandidaat ZOU zeggen na de vervolgvraag.

Regels:
- Behoud het oorspronkelijke antwoord als kern en breid uit met plausibele concrete details (week, cursist-archetype, boot, wind, actie, resultaat) die passen bij de oorspronkelijke situatie.
- Geen nieuwe tegenstrijdige feiten introduceren.
- Schrijf in de ik-vorm, verleden tijd, Nederlands, geen em-dashes.
- Output ÉÉN gecombineerd antwoord (oorspronkelijk + uitbreiding), niet apart.
- Max 250 woorden totaal.

Context: ${args.tree.profielTitel} (${args.tree.richting} niveau ${args.tree.niveauRang}), werkproces "${question.werkprocesTitel}".`,
    prompt: `Oorspronkelijke vraag: ${question.prompt}

Oorspronkelijk antwoord van kandidaat:
"${originalAnswer}"

Beoordeling: dit antwoord mist ${missing}.

Vervolgvraag van beoordelaar: ${followUp}

Geef het uitgebreide antwoord van de kandidaat.`,
    temperature: 0.4,
  });
  return object.expandedAnswer;
}

// ---- Orchestration ----

export async function runThinAnswerGate(args: {
  questions: Question[];
  answers: RawAnswer[];
  tree: RubricTree;
}): Promise<ThinGateResult> {
  const { questions, answers, tree } = args;

  // Edge case: no answers to grade. Return an empty gate result instead of
  // issuing a no-op LLM call.
  if (answers.length === 0) {
    return {
      grades: [],
      expansions: [],
      augmentedAnswers: [],
      stats: {
        totalAnswers: 0,
        heuristicThinCount: 0,
        llmFlaggedCount: 0,
        expandedCount: 0,
        gradeMs: 0,
        expandMs: 0,
      },
    };
  }

  const gradeStart = Date.now();
  const grades = await gradeAnswersWithLLM({ questions, answers, tree });
  const gradeMs = Date.now() - gradeStart;

  const heuristicThinCount = grades.filter((g) => g.heuristicThin).length;
  const llmFlaggedCount = grades.filter((g) => g.llmNeedsExpansion).length;

  // Policy: see shouldExpand() below. Extracted + exported so the threshold
  // logic is unit-testable without LLM calls.

  const expandStart = Date.now();
  const expansions: ExpandedAnswer[] = [];
  const questionById = new Map(questions.map((q) => [q.id, q]));
  const answerById = new Map(answers.map((a) => [a.questionId, a]));

  const toExpand = grades.filter((g) => shouldExpand(g));
  const results = await Promise.allSettled(
    toExpand.map(async (grade) => {
      const question = questionById.get(grade.questionId);
      const original = answerById.get(grade.questionId);
      if (!question || !original) return null;
      const expanded = await expandAnswer({
        question,
        originalAnswer: original.answer,
        grade,
        tree,
      });
      return {
        questionId: grade.questionId,
        originalAnswer: original.answer,
        expandedAnswer: expanded,
        expansionReason: grade.missingAngle ?? "dun antwoord",
      } satisfies ExpandedAnswer;
    }),
  );
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) expansions.push(r.value);
  }
  const expandMs = Date.now() - expandStart;

  // Build final answer set.
  const expandedById = new Map(expansions.map((e) => [e.questionId, e] as const));
  const augmentedAnswers: RawAnswer[] = answers.map((a) => {
    const exp = expandedById.get(a.questionId);
    if (!exp) return a;
    return { questionId: a.questionId, answer: exp.expandedAnswer };
  });

  return {
    grades,
    expansions,
    augmentedAnswers,
    stats: {
      totalAnswers: answers.length,
      heuristicThinCount,
      llmFlaggedCount,
      expandedCount: expansions.length,
      gradeMs,
      expandMs,
    },
  };
}

// ---- Helpers exposed for eval/testing ----

export function truncateAnswersToWords(
  answers: RawAnswer[],
  maxWords: number,
): RawAnswer[] {
  return answers.map((a) => {
    const words = a.answer.trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return a;
    return { questionId: a.questionId, answer: words.slice(0, maxWords).join(" ") };
  });
}

// Policy: when does the gate decide to expand an answer?
//
// We expand when BOTH signals fire:
//   - LLM flagged (needsExpansion=true), AND
//   - EITHER the answer is heuristic-thin (<50 words) OR the LLM estimated
//     concreteness as "leeg" or "dun"
//
// This guards against two failure modes:
//   - LLM over-flagging long-but-generic answers where a lot of words
//     don't translate into concrete content — we want the heuristic
//     to catch those by marking them "not thin" and we default to
//     trusting the LLM only when at least one additional signal agrees.
//   - LLM under-flagging short-but-tight answers where 40 well-chosen
//     words already carry specific situation + action + outcome — we
//     trust the LLM in those cases (needsExpansion=false overrides the
//     heuristic).
//
// Tunable. If matrix shows the policy is too aggressive (expanding
// acceptable answers) or too permissive (missing truly thin ones), adjust
// here and re-run the matrix rather than tweaking call sites.
export function shouldExpand(grade: AnswerGrade): boolean {
  return (
    grade.llmNeedsExpansion &&
    (grade.heuristicThin ||
      grade.concretenessEstimate === "leeg" ||
      grade.concretenessEstimate === "dun")
  );
}
