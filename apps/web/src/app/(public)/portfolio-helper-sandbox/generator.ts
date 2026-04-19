// Pure generator logic. No "use server", no Next.js imports. Both the server
// action (actions.ts) and the eval harness (scripts/corpus/eval.ts) call
// into this module so they exercise the same code path.

import { gateway } from "@ai-sdk/gateway";
import { generateObject } from "ai";
import type { AnswerInput, RetrievedChunkForPrompt } from "./prompts.ts";
import { buildDraftPrompt, buildQuestionsPrompt } from "./prompts.ts";
import type { Question, QuestionsPayload, WerkprocesDraft } from "./schemas.ts";
import { QuestionsPayloadSchema, WerkprocesDraftSchema } from "./schemas.ts";
import type { RubricTree } from "./types.ts";

// A function that returns per-criterium inspiration chunks for one werkproces
// batch. Injected by the caller so:
//   - Production (sandbox route) uses the ai_corpus via DB
//   - Eval uses the same source but with excludeSourceIds to prevent
//     self-leakage against the portfolio being eval'd
//   - Tests can pass a fake
//
// Returning an empty map disables per-criterium inspiration for that call.
export type RetrieveForWerkproces = (
  criteriumIds: string[],
) => Promise<Map<string, RetrievedChunkForPrompt[]>>;

export const MODEL_ID = "anthropic/claude-sonnet-4-5";

export type GeneratedQuestions = {
  profielId: string;
  profielTitel: string;
  questions: Question[];
  totalWerkprocessen: number;
  totalCriteria: number;
  elapsedMs: number;
};

export async function runQuestionGeneration(
  tree: RubricTree,
): Promise<GeneratedQuestions> {
  const start = Date.now();
  const totalCriteria = tree.werkprocessen.reduce(
    (sum, wp) => sum + wp.criteria.length,
    0,
  );
  const { system, user } = buildQuestionsPrompt(tree);

  const { object } = await generateObject({
    model: gateway(MODEL_ID),
    schema: QuestionsPayloadSchema,
    system,
    prompt: user,
    temperature: 0.4,
  });

  const werkprocesIds = new Set(tree.werkprocessen.map((w) => w.id));
  const criteriumIds = new Set(
    tree.werkprocessen.flatMap((w) => w.criteria.map((c) => c.id)),
  );
  const validQuestions = (object as QuestionsPayload).questions.filter((q) => {
    if (!werkprocesIds.has(q.werkprocesId)) return false;
    return q.criteriumIds.every((id) => criteriumIds.has(id));
  });

  if (validQuestions.length === 0) {
    throw new Error(
      "Het model leverde alleen vragen met onbekende werkproces- of criteriumId's. Probeer opnieuw.",
    );
  }

  return {
    profielId: tree.profielId,
    profielTitel: tree.profielTitel,
    questions: validQuestions,
    totalWerkprocessen: tree.werkprocessen.length,
    totalCriteria,
    elapsedMs: Date.now() - start,
  };
}

export type GeneratedDraft = {
  profielId: string;
  profielTitel: string;
  drafts: WerkprocesDraft[];
  elapsedMs: number;
  failedWerkprocessen: Array<{ werkprocesId: string; reason: string }>;
};

export async function runDraftGeneration(args: {
  tree: RubricTree;
  questions: Question[];
  answers: Array<{ questionId: string; answer: string }>;
  /** Optional Stage B per-criterium retrieval. Called once per werkproces. */
  retrieveForWerkproces?: RetrieveForWerkproces;
  /** Framing for retrieved chunks in the prompt. Default "strict". */
  retrievalFraming?: "strict" | "loose";
  /**
   * Where retrieved chunks land in the prompt. Default "inspiration" (current
   * Stage B). "fewshot" routes the chunks into the system-prompt few-shot slot
   * instead of the user-prompt inspiration block — see buildDraftPrompt.
   */
  retrievalMode?: "inspiration" | "fewshot";
  /**
   * Extra content appended to the system prompt. Used for per-kandidaat
   * context (e.g. prior-portfolio voice profile). Applied to every
   * per-werkproces call.
   */
  systemPromptExtra?: string;
}): Promise<GeneratedDraft> {
  const start = Date.now();
  const {
    tree,
    questions,
    answers,
    retrieveForWerkproces,
    retrievalFraming,
    retrievalMode,
    systemPromptExtra,
  } = args;

  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));
  const enrichedAnswers: AnswerInput[] = questions
    .map<AnswerInput | null>((q) => {
      const answer = answerMap.get(q.id);
      if (answer === undefined) return null;
      return {
        questionId: q.id,
        werkprocesId: q.werkprocesId,
        criteriumIds: q.criteriumIds,
        prompt: q.prompt,
        answer,
      };
    })
    .filter((a): a is AnswerInput => a !== null);

  const werkprocesIdsWithAnswers = new Set(
    enrichedAnswers.map((a) => a.werkprocesId),
  );
  const werkprocessenToGenerate = tree.werkprocessen.filter((wp) =>
    werkprocesIdsWithAnswers.has(wp.id),
  );

  if (werkprocessenToGenerate.length === 0) {
    throw new Error(
      "Geen antwoorden gevonden die aan werkprocessen gekoppeld zijn.",
    );
  }

  const results = await Promise.allSettled(
    werkprocessenToGenerate.map(async (wp) => {
      // Stage B: optional per-criterium inspiration from ai_corpus. Fetched
      // per werkproces so N werkprocessen run N parallel retrieval calls
      // alongside the N generation calls.
      const retrievedChunks = retrieveForWerkproces
        ? await retrieveForWerkproces(wp.criteria.map((c) => c.id))
        : undefined;

      const { system, user } = buildDraftPrompt({
        tree,
        werkprocesId: wp.id,
        answers: enrichedAnswers,
        questions,
        retrievedChunks,
        retrievalFraming,
        retrievalMode,
        systemPromptExtra,
      });
      const { object } = await generateObject({
        model: gateway(MODEL_ID),
        schema: WerkprocesDraftSchema,
        system,
        prompt: user,
        temperature: 0.5,
      });
      return object as WerkprocesDraft;
    }),
  );

  const drafts: WerkprocesDraft[] = [];
  const failedWerkprocessen: Array<{ werkprocesId: string; reason: string }> =
    [];

  results.forEach((result, index) => {
    const wp = werkprocessenToGenerate[index];
    if (!wp) return;
    if (result.status === "fulfilled") {
      drafts.push(result.value);
    } else {
      failedWerkprocessen.push({
        werkprocesId: wp.id,
        reason:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      });
    }
  });

  if (drafts.length === 0) {
    throw new Error(
      `Alle ${werkprocessenToGenerate.length} werkproces-generaties faalden. Eerste fout: ${failedWerkprocessen[0]?.reason ?? "onbekend"}`,
    );
  }

  return {
    profielId: tree.profielId,
    profielTitel: tree.profielTitel,
    drafts,
    elapsedMs: Date.now() - start,
    failedWerkprocessen,
  };
}
