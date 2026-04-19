"use server";

import { AiCorpus } from "@nawadi/core";
import {
  type GeneratedDraft,
  type GeneratedQuestions,
  runDraftGeneration,
  runQuestionGeneration,
} from "./generator.ts";
import { getReferenceChunksBatch } from "./retrieval.ts";
import { loadRubricTree } from "./rubric.ts";
import type { Question } from "./schemas.ts";
import type { OutlineTemplate } from "./types.ts";

// Stage B (per-criterium retrieval from ai_corpus) — enabled for the sandbox
// route once matrix validated the fewshot mode on 2026-04-19.
//
// History:
//   1. Initial Stage B with "inspiration" framing (chunks in user prompt):
//      +10.3% length, 76.2% concreteness ratio vs noise baseline +3.9%/85.7%.
//      Closed.
//   2. Loose framing + top-1 chunks: +11.4% / 81.0%. Also closed.
//   3. Fewshot mode (chunks in system-prompt few-shot slot, replacing hand-
//      picked examples, padded with FEW_SHOT_EXAMPLES when <3 returned):
//      +2.0% / 85.7%. Length BETTER than baseline (1.9pp = 3× noise floor),
//      concreteness tied. Production default.
//
// Flip to false (or set STAGE_B_ENABLED=false in env) to disable retrieval
// and fall back to pure Stage A. The infrastructure (ai_corpus tables,
// ingested seed data, retrieval helper, eval-runner wiring) stays live
// either way.
const STAGE_B_ENABLED = process.env.STAGE_B_ENABLED !== "false";
const STAGE_B_MAX_RESULTS = 3;
const STAGE_B_MODE: "inspiration" | "fewshot" = "fewshot";

// Gateway reads AI_GATEWAY_API_KEY from env. No retry wrapper, no fallback;
// errors surface to the client so we see real failures during Phase 1.
function requireGatewayKey(): void {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(
      "AI_GATEWAY_API_KEY ontbreekt in apps/web/.env.local. Voeg 'm toe en herstart de dev server.",
    );
  }
}

export type GenerateQuestionsResult = GeneratedQuestions;
export type GenerateDraftResult = GeneratedDraft;

export async function generateQuestions(input: {
  profielId: string;
}): Promise<GenerateQuestionsResult> {
  requireGatewayKey();
  const tree = await loadRubricTree(input.profielId);
  return runQuestionGeneration(tree);
}

export async function getOutline(input: {
  profielId: string;
}): Promise<OutlineTemplate | null> {
  const template = await AiCorpus.getOutlineTemplate({
    profielId: input.profielId,
  });
  if (!template) return null;
  const tree = await loadRubricTree(input.profielId);
  return {
    templateId: template.templateId,
    profielId: template.profielId,
    profielTitel: tree.profielTitel,
    niveauRang: tree.niveauRang,
    richting: tree.richting,
    version: template.version,
    sections: template.sections,
  };
}

export async function generateDraft(input: {
  profielId: string;
  questions: Question[];
  answers: Array<{ questionId: string; answer: string }>;
}): Promise<GenerateDraftResult> {
  requireGatewayKey();
  const tree = await loadRubricTree(input.profielId);

  const retrieveForWerkproces = STAGE_B_ENABLED
    ? (criteriumIds: string[]) =>
        getReferenceChunksBatch({
          criteriumIds,
          maxResultsPerCriterium: STAGE_B_MAX_RESULTS,
        })
    : undefined;

  return runDraftGeneration({
    tree,
    questions: input.questions,
    answers: input.answers,
    retrieveForWerkproces,
    retrievalMode: STAGE_B_MODE,
  });
}
