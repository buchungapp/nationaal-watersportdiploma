// Reusable eval pipeline. Called by:
//   - scripts/corpus/eval.ts        (single-portfolio CLI)
//   - scripts/corpus/eval-matrix.ts (multi-portfolio dashboard)
//
// The pipeline matches the design discussion:
//   1. Load anonymized portfolio
//   2. Load kwalificatieprofiel rubric tree (raw SQL)
//   3. LLM: extract (criteriumId, goldenBewijs) pairs
//   4. LLM: synthesize raw kandidaat answers per pair (in parallel)
//   5. Run runDraftGeneration() — same code path as the sandbox
//   6. Pair generated vs golden by criteriumId
//   7. Score + per-portfolio markdown report
//
// Exports:
//   runEval()                - runs the whole pipeline, returns aggregates
//   loadRubricByProfielTitel - used by both eval.ts and eval-matrix.ts
//   isRubricPopulated        - gate for niveau-5-not-seeded entries

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gateway } from "@ai-sdk/gateway";
import { AiCorpus } from "@nawadi/core";
import { generateObject } from "ai";
import pg from "pg";
import { Agent, setGlobalDispatcher } from "undici";
import { z } from "zod";

// Extend node's default fetch timeouts (undici's headersTimeout default of
// ~5min and bodyTimeout of ~5min both trip on long LLM calls over big
// portfolios). 10 minutes per call is comfortably above the observed
// worst-case (jade @ 20K words extraction was ~5 min).
setGlobalDispatcher(
  new Agent({
    headersTimeout: 600_000,
    bodyTimeout: 600_000,
    keepAliveTimeout: 600_000,
    connectTimeout: 30_000,
  }),
);
import { runDraftGeneration } from "./portfolio-generator/generator.ts";

// Pinned model id — eval reports log this alongside results; bumping
// here invalidates comparability with prior eval runs. Update
// deliberately when producing a new model-comparison baseline.
const MODEL_ID = "anthropic/claude-sonnet-4-5";
import type { Question } from "./portfolio-generator/schemas.ts";
import {
  runThinAnswerGate,
  truncateAnswersToWords,
} from "./portfolio-generator/thin-answer-gate.ts";
import type {
  RubricCriterium,
  RubricTree,
  RubricWerkproces,
} from "./portfolio-generator/types.ts";
import {
  ANONYMIZED_DIR,
  type AnonymizedPortfolio,
  GOLDEN_DIR,
  REPORTS_DIR,
} from "./shared.ts";

// ---------- golden dataset cache ----------
//
// Extraction + synthesis are expensive (LLM calls) and deterministic-ish at
// temperature 0–0.2. Caching them per (portfolioFile, profielTitel) makes:
//   - matrix re-runs 2–3× faster and cheaper
//   - A/B comparisons between configs less noisy (same goldens → only draft
//     variance shows up in the metrics)
//
// Cache lives at .tmp/portfolio-corpus/golden/<portfolioFile-without-.json>__<profielTitel-slug>.json
// Delete the file to force rebuild. No hash-based invalidation in v1 — if we
// change extraction or synthesis prompts and want to rebuild, clear the dir.

type GoldenPair = {
  criteriumId: string;
  criteriumTitel: string;
  werkprocesId: string;
  goldenBewijs: string;
  rawAnswer: string;
};

type GoldenCache = {
  portfolioFile: string;
  profielTitel: string;
  profielId: string;
  niveauRang: number;
  pairs: GoldenPair[];
  builtAt: string;
  extractionMs: number;
  synthesisMs: number;
};

function goldenCachePath(portfolioFile: string, profielTitel: string): string {
  const portfolioSlug = portfolioFile.replace(/\.json$/, "");
  const profielSlug = profielTitel.replace(/\s+/g, "_");
  return join(GOLDEN_DIR, `${portfolioSlug}__${profielSlug}.json`);
}

function loadGolden(
  portfolioFile: string,
  profielTitel: string,
): GoldenCache | null {
  const path = goldenCachePath(portfolioFile, profielTitel);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as GoldenCache;
  } catch {
    return null;
  }
}

function saveGolden(cache: GoldenCache): void {
  mkdirSync(GOLDEN_DIR, { recursive: true });
  writeFileSync(
    goldenCachePath(cache.portfolioFile, cache.profielTitel),
    `${JSON.stringify(cache, null, 2)}\n`,
  );
}

const PGURI =
  process.env.PGURI ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

// Resolve the ai_corpus source_id for a given source_identifier (e.g.
// 'seed:alle_niveau_3_bob') via a cheap direct SQL lookup. Used during eval
// to exclude the portfolio currently being eval'd from retrieval so the
// model doesn't get to peek at its own answer key.
async function findSelfSourceIds(input: {
  sourceIdentifier: string;
}): Promise<string[]> {
  const client = new pg.Client({ connectionString: PGURI });
  await client.connect();
  try {
    const res = await client.query<{ id: string }>(
      `SELECT id FROM ai_corpus.source WHERE source_identifier = $1 AND revoked_at IS NULL`,
      [input.sourceIdentifier],
    );
    return res.rows.map((r) => r.id);
  } finally {
    await client.end();
  }
}

export type RubricLookupResult =
  | { status: "found"; tree: RubricTree }
  | { status: "empty"; titel: string }
  | { status: "missing"; titel: string };

// Load the rubric tree for a profiel by titel. Returns "empty" when the
// profiel exists but has no werkprocessen (e.g. niveau 5 stubs) so the matrix
// runner can skip cleanly. Returns "missing" when the titel doesn't resolve.
export async function loadRubricByProfielTitel(
  profielTitel: string,
): Promise<RubricLookupResult> {
  const client = new pg.Client({ connectionString: PGURI });
  await client.connect();
  try {
    const res = await client.query<{
      profielId: string;
      profielTitel: string;
      richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
      niveauRang: number;
      kerntaakId: string | null;
      werkprocesId: string | null;
      werkprocesTitel: string | null;
      resultaat: string | null;
      werkprocesRang: number | null;
      criteriumId: string | null;
      criteriumTitel: string | null;
      omschrijving: string | null;
      criteriumRang: number | null;
    }>(
      `
      SELECT
        kp.id AS "profielId",
        kp.titel AS "profielTitel",
        kp.richting AS richting,
        n.rang AS "niveauRang",
        kt.id AS "kerntaakId",
        wp.id AS "werkprocesId",
        wp.titel AS "werkprocesTitel",
        wp.resultaat AS resultaat,
        wp.rang AS "werkprocesRang",
        bc.id AS "criteriumId",
        bc.title AS "criteriumTitel",
        bc.omschrijving AS omschrijving,
        bc.rang AS "criteriumRang"
      FROM kss.kwalificatieprofiel kp
      JOIN kss.niveau n ON n.id = kp.niveau_id
      LEFT JOIN kss.kerntaak kt ON kt.kwalificatieprofiel_id = kp.id
      LEFT JOIN kss.werkproces wp ON wp.kerntaak_id = kt.id
      LEFT JOIN kss.beoordelingscriterium bc ON bc.werkproces_id = wp.id
      WHERE kp.titel = $1
      ORDER BY kt.rang NULLS LAST, wp.rang NULLS LAST, bc.rang NULLS LAST
      `,
      [profielTitel],
    );

    if (res.rows.length === 0) {
      return { status: "missing", titel: profielTitel };
    }

    const firstRow = res.rows[0]!;
    const werkprocesMap = new Map<string, RubricWerkproces>();
    for (const row of res.rows) {
      if (!row.werkprocesId || !row.kerntaakId) continue;
      let wp = werkprocesMap.get(row.werkprocesId);
      if (!wp) {
        wp = {
          id: row.werkprocesId,
          kerntaakId: row.kerntaakId,
          titel: row.werkprocesTitel ?? "",
          resultaat: row.resultaat ?? "",
          rang: row.werkprocesRang ?? 0,
          criteria: [],
        };
        werkprocesMap.set(row.werkprocesId, wp);
      }
      if (row.criteriumId) {
        const c: RubricCriterium = {
          id: row.criteriumId,
          title: row.criteriumTitel ?? "",
          omschrijving: row.omschrijving ?? "",
          rang: row.criteriumRang ?? 0,
        };
        if (!wp.criteria.some((x) => x.id === c.id)) wp.criteria.push(c);
      }
    }

    if (werkprocesMap.size === 0) {
      return { status: "empty", titel: profielTitel };
    }

    const tree: RubricTree = {
      profielId: firstRow.profielId,
      profielTitel: firstRow.profielTitel,
      richting: firstRow.richting,
      niveauRang: firstRow.niveauRang,
      werkprocessen: [...werkprocesMap.values()]
        .map((wp) => ({
          ...wp,
          criteria: wp.criteria.sort((a, b) => a.rang - b.rang),
        }))
        .sort((a, b) => a.rang - b.rang),
    };
    return { status: "found", tree };
  } finally {
    await client.end();
  }
}

// ---------- scoring primitives ----------
//
// These functions are now defined in @nawadi/core's portfolio-scoring module
// so the leercoach + checker + review surfaces all share one implementation.
// Re-exported here so existing imports (eval.ts, experiment-prior-context*.ts)
// keep working without changes.
//
// Matrix noise floor (±0.6pp length, 0.0 concreteness) was measured against
// the inlined implementations on 2026-04-19 and verified byte-identical after
// extraction — see packages/core/src/models/portfolio-scoring/score.test.ts.

import { PortfolioScoring } from "@nawadi/core";

export const {
  antiTellCount,
  compareBewijs,
  concretenessPer100,
  metaCodaCount,
  scoreBewijs,
  wordCount,
} = PortfolioScoring;

// ---------- pipeline ----------

export type EvalAggregates = {
  // Draft-output metrics (what we already measured)
  pairsExtracted: number;
  pairsCovered: number;
  pairsMissing: number;
  coverageRatio: number;
  avgGoldenWc: number;
  avgGeneratedWc: number;
  avgLengthDeltaPct: number;
  avgGoldenConcreteness: number;
  avgGeneratedConcreteness: number;
  totalGoldenAntiTells: number;
  totalGeneratedAntiTells: number;
  totalGeneratedMetaCoda: number;
  // Pipeline-stage metrics (Stage E: visibility into intermediates).
  // When retrieval is disabled these stay at 0.
  goldenSource: "cached" | "freshly_extracted";
  extractionMs: number;
  synthesisMs: number;
  draftMs: number;
  totalMs: number;
  avgSynthAnswerWc: number;
  retrievalEnabled: boolean;
  retrievalCallsIssued: number;
  retrievalChunksReturned: number;
  avgRetrievedChunkWc: number;
  avgRetrievedChunkConcreteness: number;
  // Thin-answer gate telemetry (Stage F, #3).
  thinGateEnabled: boolean;
  thinGateTotalAnswers: number;
  thinGateHeuristicThinCount: number;
  thinGateLlmFlaggedCount: number;
  thinGateExpandedCount: number;
  thinGateGradeMs: number;
  thinGateExpandMs: number;
  forceThinAnswers: number | null;
  avgAnswerWcAfterGate: number;
};

export type ScoredPair = {
  criteriumId: string;
  criteriumTitel: string;
  werkprocesTitel: string;
  rawAnswer: string;
  goldenBewijs: string;
  generatedBewijs: string | null;
  goldenWc: number;
  generatedWc: number | null;
  lengthDeltaPct: number | null;
  goldenConcreteness: number;
  generatedConcreteness: number | null;
  goldenAntiTells: number;
  generatedAntiTells: number | null;
  generatedMetaCoda: number | null;
};

export type EvalResult = {
  portfolioFile: string;
  profielTitel: string;
  pageCount: number;
  charCount: number;
  niveauRang: number;
  aggregates: EvalAggregates;
  pairs: ScoredPair[];
  reportPath: string;
  skipped?: { reason: string };
  failures?: string[];
};

const avg = (xs: number[]): number => {
  if (xs.length === 0) return 0;
  return Math.round((xs.reduce((s, n) => s + n, 0) / xs.length) * 10) / 10;
};

export async function runEval(input: {
  portfolioFile: string;
  profielTitel: string;
  /** Directory to write the per-portfolio markdown detail. Defaults to REPORTS_DIR. */
  outputDir?: string;
  /** Optional tag in the report filename. */
  tag?: string;
  /** Console logger override — matrix runner uses prefixed logs. */
  log?: (line: string) => void;
  /**
   * Stage B gate. When true, the draft generator receives retrieved chunks
   * from ai_corpus per criterium, with self-exclusion. When false (default),
   * Stage B is disabled and eval measures the pure Stage A prompt behavior.
   * Used for ablations, not production default.
   */
  retrievalEnabled?: boolean;
  /** Stage B ablation: chunks per criterium. Default 2. */
  retrievalMaxResults?: number;
  /** Stage B ablation: prompt framing. Default "strict". */
  retrievalFraming?: "strict" | "loose";
  /**
   * Stage B ablation: where retrieved chunks land in the prompt. Default
   * "inspiration" (user-prompt inspiration block). "fewshot" routes them
   * into the system-prompt few-shot slot instead.
   */
  retrievalMode?: "inspiration" | "fewshot";
  /**
   * Thin-answer gate. When true, each synth answer is graded by an LLM; thin
   * ones get an auto-expansion pass (simulating an engaged kandidaat's
   * response to a targeted follow-up). Expanded answers replace originals in
   * the draft stage. Off by default — matrix flag only.
   */
  thinAnswerGate?: boolean;
  /**
   * Force-truncate synth answers to N words before drafting. Used to simulate
   * thin input and test whether the thin-answer gate recovers quality. Off
   * (null) by default — matrix flag only.
   */
  forceThinAnswers?: number | null;
}): Promise<EvalResult> {
  const log = input.log ?? ((l) => console.log(l));
  const startTotal = Date.now();

  const portfolio = JSON.parse(
    readFileSync(join(ANONYMIZED_DIR, input.portfolioFile), "utf8"),
  ) as AnonymizedPortfolio;

  const rubric = await loadRubricByProfielTitel(input.profielTitel);
  if (rubric.status !== "found") {
    const reason =
      rubric.status === "empty"
        ? `Rubric voor "${input.profielTitel}" is leeg (stub). Seed werkprocessen + criteria en probeer opnieuw.`
        : `Kwalificatieprofiel "${input.profielTitel}" niet gevonden.`;
    return {
      portfolioFile: input.portfolioFile,
      profielTitel: input.profielTitel,
      pageCount: portfolio.pageCount,
      charCount: portfolio.charCount,
      niveauRang: 0,
      aggregates: emptyAggregates(),
      pairs: [],
      reportPath: "",
      skipped: { reason },
    };
  }

  const tree = rubric.tree;
  log(
    `${input.portfolioFile}: ${tree.profielTitel} (${tree.richting} n${tree.niveauRang}) · ${tree.werkprocessen.length} werkprocessen · ${tree.werkprocessen.reduce((s, w) => s + w.criteria.length, 0)} criteria`,
  );

  // ---- Extract golden pairs ----
  const GoldenPairsSchema = z.object({
    pairs: z
      .array(
        z.object({
          criteriumId: z.string().uuid(),
          criteriumTitel: z.string(),
          goldenBewijs: z.string().min(80),
        }),
      )
      .min(1)
      .max(200),
  });

  const criteriaList = tree.werkprocessen
    .flatMap((wp) =>
      wp.criteria.map(
        (c) =>
          `- werkproces "${wp.titel}" / criterium "${c.title}" (id: ${c.id}): ${c.omschrijving}`,
      ),
    )
    .join("\n");

  // ---- Load or build the golden cache (extraction + synthesis) ----
  let goldenSource: "cached" | "freshly_extracted" = "cached";
  let extractionMs = 0;
  let synthesisMs = 0;
  let cache = loadGolden(input.portfolioFile, tree.profielTitel);

  if (!cache) {
    goldenSource = "freshly_extracted";

    log(`  extracting golden pairs (no cache)...`);
    const extractionStart = Date.now();
    const { object: extracted } = await generateObject({
      model: gateway(MODEL_ID),
      schema: GoldenPairsSchema,
      system: `Je ontleedt een Nederlands PvB-portfolio in (criterium, bewijs) paren.

Voor elk criterium uit de rubriek waar de portfolio-tekst direct naar toe werkt, knip je de bewijs-paragraaf eruit en koppel je die aan het criteriumId.

REGELS:
- Gebruik alleen bewijs dat letterlijk uit de portfolio komt. Geen samenvatting, geen parafrase.
- Één criterium kan maximaal één bewijs-blok hebben. Kies de meest representatieve passage.
- Als een criterium niet wordt gedekt, sla het over.
- Bewijs-lengte: minimaal 80 woorden, ideaal 200-500.
- criteriumId moet letterlijk een van de id's uit de rubriek zijn.`,
      prompt: `Rubriek:\n${criteriaList}\n\nPortfolio-tekst:\n---\n${portfolio.anonymizedText}\n---\n\nOntleed in (criteriumId, goldenBewijs) paren.`,
      temperature: 0,
    });
    extractionMs = Date.now() - extractionStart;

    const allCriteriumIds = new Set(
      tree.werkprocessen.flatMap((w) => w.criteria.map((c) => c.id)),
    );
    const validPairs = extracted.pairs.filter((p) =>
      allCriteriumIds.has(p.criteriumId),
    );
    log(
      `  extracted ${validPairs.length}/${extracted.pairs.length} pairs in ${(extractionMs / 1000).toFixed(1)}s`,
    );

    if (validPairs.length === 0) {
      return {
        portfolioFile: input.portfolioFile,
        profielTitel: tree.profielTitel,
        pageCount: portfolio.pageCount,
        charCount: portfolio.charCount,
        niveauRang: tree.niveauRang,
        aggregates: emptyAggregates(),
        pairs: [],
        reportPath: "",
        skipped: {
          reason: "Geen bruikbare pairs uit de portfolio-tekst.",
        },
      };
    }

    // ---- Synthesize raw answers ----
    log(
      `  synthesising raw answers for ${validPairs.length} pairs (parallel)...`,
    );
    const SynthesizedAnswerSchema = z.object({
      rawAnswer: z.string().min(30),
    });

    const synthStart = Date.now();
    const synthesizedAnswers = await Promise.all(
      validPairs.map(async (pair) => {
        const wp = tree.werkprocessen.find((w) =>
          w.criteria.some((c) => c.id === pair.criteriumId),
        );
        const criterium = wp?.criteria.find((c) => c.id === pair.criteriumId);
        const { object } = await generateObject({
          model: gateway(MODEL_ID),
          schema: SynthesizedAnswerSchema,
          system: `Je doet het omgekeerde van een schrijfcoach: je leest een gepolijst bewijs-stuk en reconstrueert wat de kandidaat waarschijnlijk in een coachgesprek heeft verteld.

De reconstructie is RUW en ONGEPOLIJST:
- Feitelijk, chronologisch, in spreektaal.
- 2 tot 5 zinnen, geen alinea's.
- Geen zelfreflectie, geen meta-commentaar, geen "dit toont aan dat...".
- Geen STAR-structuur - alleen de feiten die nodig waren om later STAR te schrijven.
- Als de bewijstekst specifieke aantallen of situaties noemt, neem die over.
- Gebruik de bestaande [KANDIDAAT] / [LOCATIE] / [VERENIGING] / [DATUM] tokens waar die in de brontekst stonden.`,
          prompt: `Criterium: ${criterium?.title ?? "(onbekend)"}
Omschrijving: ${criterium?.omschrijving ?? ""}
Werkproces: ${wp?.titel ?? "(onbekend)"}

Gepolijst bewijs uit portfolio:
---
${pair.goldenBewijs}
---

Reconstrueer de ruwe kandidaat-input:`,
          temperature: 0.2,
        });
        return {
          criteriumId: pair.criteriumId,
          criteriumTitel: pair.criteriumTitel,
          werkprocesId: wp?.id ?? "",
          goldenBewijs: pair.goldenBewijs,
          rawAnswer: object.rawAnswer,
        };
      }),
    );
    synthesisMs = Date.now() - synthStart;
    log(
      `  synthesised ${synthesizedAnswers.length} answers in ${(synthesisMs / 1000).toFixed(1)}s`,
    );

    cache = {
      portfolioFile: input.portfolioFile,
      profielTitel: tree.profielTitel,
      profielId: tree.profielId,
      niveauRang: tree.niveauRang,
      pairs: synthesizedAnswers,
      builtAt: new Date().toISOString(),
      extractionMs,
      synthesisMs,
    };
    saveGolden(cache);
    log(`  golden cached at ${goldenCachePath(input.portfolioFile, tree.profielTitel).split("/").slice(-3).join("/")}`);
  } else {
    log(
      `  loaded ${cache.pairs.length} golden pairs from cache (built ${cache.builtAt.slice(0, 16)}; extraction+synthesis skipped)`,
    );
  }

  // Normalise to the shape the rest of the pipeline expects.
  const validPairs = cache.pairs.map((p) => ({
    criteriumId: p.criteriumId,
    criteriumTitel: p.criteriumTitel,
    goldenBewijs: p.goldenBewijs,
  }));
  const synthesizedAnswers = cache.pairs.map((p) => ({
    criteriumId: p.criteriumId,
    werkprocesId: p.werkprocesId,
    rawAnswer: p.rawAnswer,
  }));

  // ---- Build Question[] + run the draft generator ----
  const questions: Question[] = synthesizedAnswers
    .filter((a) => a.werkprocesId)
    .map((a, i) => {
      const wp = tree.werkprocessen.find((w) => w.id === a.werkprocesId);
      return {
        id: `eval-q-${i}`,
        werkprocesId: a.werkprocesId,
        werkprocesTitel: wp?.titel ?? "",
        criteriumIds: [a.criteriumId],
        prompt: "Eval-sandbox: reconstructed question (not shown to user).",
      };
    });
  let answers = synthesizedAnswers.map((a, i) => ({
    questionId: `eval-q-${i}`,
    answer: a.rawAnswer,
  }));

  // Optional: force-truncate answers before drafting to simulate thin input.
  // Off by default; only used for thin-answer-gate ablations.
  const forceThinN = input.forceThinAnswers ?? null;
  if (forceThinN !== null && forceThinN > 0) {
    const before = answers.map((a) => a.answer.trim().split(/\s+/).filter(Boolean).length);
    answers = truncateAnswersToWords(answers, forceThinN);
    const after = answers.map((a) => a.answer.trim().split(/\s+/).filter(Boolean).length);
    log(
      `  force-thin=${forceThinN} applied: avg words ${Math.round(before.reduce((s, n) => s + n, 0) / Math.max(1, before.length))} → ${Math.round(after.reduce((s, n) => s + n, 0) / Math.max(1, after.length))}`,
    );
  }

  // Optional: thin-answer gate. LLM grades each answer; thin ones are auto-
  // expanded (simulated follow-up). Expanded answers replace originals for
  // the draft stage. Telemetry surfaces in thinGate below.
  let thinGateTelemetry: {
    enabled: boolean;
    totalAnswers: number;
    heuristicThinCount: number;
    llmFlaggedCount: number;
    expandedCount: number;
    gradeMs: number;
    expandMs: number;
  } = {
    enabled: false,
    totalAnswers: answers.length,
    heuristicThinCount: 0,
    llmFlaggedCount: 0,
    expandedCount: 0,
    gradeMs: 0,
    expandMs: 0,
  };
  if (input.thinAnswerGate) {
    log(`  thin-answer gate ON: grading ${answers.length} answers...`);
    const gateResult = await runThinAnswerGate({
      questions,
      answers,
      tree,
      modelId: MODEL_ID,
    });
    thinGateTelemetry = {
      enabled: true,
      ...gateResult.stats,
    };
    log(
      `  gate done: heuristic-thin ${gateResult.stats.heuristicThinCount}/${gateResult.stats.totalAnswers} · llm-flagged ${gateResult.stats.llmFlaggedCount} · expanded ${gateResult.stats.expandedCount} · gradeMs ${gateResult.stats.gradeMs} · expandMs ${gateResult.stats.expandMs}`,
    );
    answers = gateResult.augmentedAnswers;
  }

  // Resolve our own ai_corpus source id (if seed-ingested) so we can exclude
  // it from retrieval and avoid peeking at our own answer key.
  const selfSourceIdentifier = `seed:${input.portfolioFile.replace(/\.json$/, "")}`;
  const excludeSourceIds = await findSelfSourceIds({
    sourceIdentifier: selfSourceIdentifier,
  });

  // Track retrieval telemetry for pipeline-stage metrics, even when disabled
  // (so the aggregates row shape stays consistent).
  let retrievalCallsIssued = 0;
  let retrievalChunksReturned = 0;
  const retrievedChunkWcs: number[] = [];
  const retrievedChunkConcretenesses: number[] = [];

  const retrievalEnabled = input.retrievalEnabled ?? false;
  const retrievalMaxResults = input.retrievalMaxResults ?? 2;
  const retrievalFraming = input.retrievalFraming ?? "strict";
  const retrievalMode = input.retrievalMode ?? "inspiration";

  log(
    `  running draft generator on ${questions.length} answers · retrieval ${retrievalEnabled ? `ON (top-${retrievalMaxResults}, ${retrievalFraming}, mode=${retrievalMode})` : "OFF"}${excludeSourceIds.length > 0 ? ` (excluding self source ${excludeSourceIds[0]?.slice(0, 8)})` : ""}...`,
  );
  const draftStart = Date.now();
  const draftResult = await runDraftGeneration({
    tree,
    questions,
    answers,
    retrievalFraming,
    retrievalMode,
    modelId: MODEL_ID,
    retrieveForWerkproces: retrievalEnabled
      ? async (criteriumIds) => {
          retrievalCallsIssued += criteriumIds.length;
          const entries = await Promise.all(
            criteriumIds.map(async (criteriumId) => {
              const chunks = await AiCorpus.getChunksForCriterium({
                criteriumId,
                excludeSourceIds,
                maxResults: retrievalMaxResults,
              });
              retrievalChunksReturned += chunks.length;
              for (const c of chunks) {
                retrievedChunkWcs.push(c.wordCount);
                if (c.qualityScore !== null) {
                  retrievedChunkConcretenesses.push(c.qualityScore);
                }
              }
              return [
                criteriumId,
                chunks.map((c) => ({
                  content: c.content,
                  wordCount: c.wordCount,
                  qualityScore: c.qualityScore,
                  sourceIdentifier: c.sourceIdentifier,
                })),
              ] as const;
            }),
          );
          return new Map(entries);
        }
      : undefined,
  });
  const draftMs = Date.now() - draftStart;
  log(
    `  generated ${draftResult.drafts.length} werkproces drafts in ${(draftMs / 1000).toFixed(1)}s`,
  );

  // ---- Pair + score ----
  const generatedMap = new Map<string, { bewijs: string; wpTitel: string }>();
  for (const d of draftResult.drafts) {
    for (const c of d.criteria) {
      generatedMap.set(c.criteriumId, {
        bewijs: c.bewijs,
        wpTitel: d.werkprocesTitel,
      });
    }
  }

  const pairs: ScoredPair[] = validPairs.map((p) => {
    const wp = tree.werkprocessen.find((w) =>
      w.criteria.some((c) => c.id === p.criteriumId),
    );
    const synth = synthesizedAnswers.find(
      (a) => a.criteriumId === p.criteriumId,
    );
    const generatedBewijs = generatedMap.get(p.criteriumId)?.bewijs ?? null;
    const goldenWc = wordCount(p.goldenBewijs);
    const generatedWc = generatedBewijs ? wordCount(generatedBewijs) : null;
    const lengthDeltaPct =
      generatedWc !== null && goldenWc > 0
        ? Math.round(((generatedWc - goldenWc) / goldenWc) * 1000) / 10
        : null;
    return {
      criteriumId: p.criteriumId,
      criteriumTitel: p.criteriumTitel,
      werkprocesTitel: wp?.titel ?? "",
      rawAnswer: synth?.rawAnswer ?? "",
      goldenBewijs: p.goldenBewijs,
      generatedBewijs,
      goldenWc,
      generatedWc,
      lengthDeltaPct,
      goldenConcreteness: concretenessPer100(p.goldenBewijs),
      generatedConcreteness: generatedBewijs
        ? concretenessPer100(generatedBewijs)
        : null,
      goldenAntiTells: antiTellCount(p.goldenBewijs),
      generatedAntiTells: generatedBewijs
        ? antiTellCount(generatedBewijs)
        : null,
      generatedMetaCoda: generatedBewijs ? metaCodaCount(generatedBewijs) : null,
    };
  });

  const covered = pairs.filter((s) => s.generatedBewijs !== null);

  const aggregates: EvalAggregates = {
    pairsExtracted: pairs.length,
    pairsCovered: covered.length,
    pairsMissing: pairs.length - covered.length,
    coverageRatio:
      pairs.length === 0 ? 0 : (covered.length / pairs.length) * 100,
    avgGoldenWc: avg(pairs.map((s) => s.goldenWc)),
    avgGeneratedWc: avg(covered.map((s) => s.generatedWc ?? 0)),
    avgLengthDeltaPct: avg(covered.map((s) => s.lengthDeltaPct ?? 0)),
    avgGoldenConcreteness: avg(pairs.map((s) => s.goldenConcreteness)),
    avgGeneratedConcreteness: avg(
      covered.map((s) => s.generatedConcreteness ?? 0),
    ),
    totalGoldenAntiTells: pairs.reduce((s, r) => s + r.goldenAntiTells, 0),
    totalGeneratedAntiTells: covered.reduce(
      (s, r) => s + (r.generatedAntiTells ?? 0),
      0,
    ),
    totalGeneratedMetaCoda: covered.reduce(
      (s, r) => s + (r.generatedMetaCoda ?? 0),
      0,
    ),
    goldenSource,
    extractionMs,
    synthesisMs,
    draftMs,
    totalMs: Date.now() - startTotal,
    avgSynthAnswerWc: avg(cache.pairs.map((p) => wordCount(p.rawAnswer))),
    retrievalEnabled,
    retrievalCallsIssued,
    retrievalChunksReturned,
    avgRetrievedChunkWc: avg(retrievedChunkWcs),
    avgRetrievedChunkConcreteness: avg(retrievedChunkConcretenesses),
    thinGateEnabled: thinGateTelemetry.enabled,
    thinGateTotalAnswers: thinGateTelemetry.totalAnswers,
    thinGateHeuristicThinCount: thinGateTelemetry.heuristicThinCount,
    thinGateLlmFlaggedCount: thinGateTelemetry.llmFlaggedCount,
    thinGateExpandedCount: thinGateTelemetry.expandedCount,
    thinGateGradeMs: thinGateTelemetry.gradeMs,
    thinGateExpandMs: thinGateTelemetry.expandMs,
    forceThinAnswers: forceThinN,
    avgAnswerWcAfterGate: avg(
      answers.map((a) => a.answer.trim().split(/\s+/).filter(Boolean).length),
    ),
  };

  // ---- Write per-portfolio detail report ----
  const reportDir = input.outputDir ?? REPORTS_DIR;
  mkdirSync(reportDir, { recursive: true });
  const reportName = `eval-${input.portfolioFile.replace(/\.json$/, "")}${input.tag ? `-${input.tag}` : ""}-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.md`;
  const reportPath = join(reportDir, reportName);
  writeFileSync(reportPath, renderPortfolioReport({
    portfolioFile: input.portfolioFile,
    profielTitel: tree.profielTitel,
    pageCount: portfolio.pageCount,
    charCount: portfolio.charCount,
    aggregates,
    pairs,
    failures: draftResult.failedWerkprocessen.map((f) => f.reason),
  }));

  return {
    portfolioFile: input.portfolioFile,
    profielTitel: tree.profielTitel,
    pageCount: portfolio.pageCount,
    charCount: portfolio.charCount,
    niveauRang: tree.niveauRang,
    aggregates,
    pairs,
    reportPath,
    failures: draftResult.failedWerkprocessen.map((f) => f.reason),
  };
}

function emptyAggregates(): EvalAggregates {
  return {
    pairsExtracted: 0,
    pairsCovered: 0,
    pairsMissing: 0,
    coverageRatio: 0,
    avgGoldenWc: 0,
    avgGeneratedWc: 0,
    avgLengthDeltaPct: 0,
    avgGoldenConcreteness: 0,
    avgGeneratedConcreteness: 0,
    totalGoldenAntiTells: 0,
    totalGeneratedAntiTells: 0,
    totalGeneratedMetaCoda: 0,
    goldenSource: "freshly_extracted",
    extractionMs: 0,
    synthesisMs: 0,
    draftMs: 0,
    totalMs: 0,
    avgSynthAnswerWc: 0,
    retrievalEnabled: false,
    retrievalCallsIssued: 0,
    retrievalChunksReturned: 0,
    avgRetrievedChunkWc: 0,
    avgRetrievedChunkConcreteness: 0,
    thinGateEnabled: false,
    thinGateTotalAnswers: 0,
    thinGateHeuristicThinCount: 0,
    thinGateLlmFlaggedCount: 0,
    thinGateExpandedCount: 0,
    thinGateGradeMs: 0,
    thinGateExpandMs: 0,
    forceThinAnswers: null,
    avgAnswerWcAfterGate: 0,
  };
}

function renderPortfolioReport(args: {
  portfolioFile: string;
  profielTitel: string;
  pageCount: number;
  charCount: number;
  aggregates: EvalAggregates;
  pairs: ScoredPair[];
  failures: string[];
}): string {
  const { aggregates: agg } = args;
  const lines: string[] = [];
  lines.push(`# Eval report: ${args.portfolioFile} vs ${args.profielTitel}\n`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(
    `Model: ${MODEL_ID}  ·  Portfolio: ${args.charCount} chars  ·  ${args.pageCount} pages\n`,
  );
  lines.push(`## Aggregates\n`);
  lines.push(`| Metric | Golden | Generated | Delta |`);
  lines.push(`|---|---|---|---|`);
  lines.push(
    `| Pairs | ${agg.pairsExtracted} | ${agg.pairsCovered} (${agg.coverageRatio.toFixed(1)}%) | missing: ${agg.pairsMissing} |`,
  );
  lines.push(
    `| Avg words / bewijs | ${agg.avgGoldenWc} | ${agg.avgGeneratedWc} | ${agg.avgLengthDeltaPct > 0 ? "+" : ""}${agg.avgLengthDeltaPct}% |`,
  );
  lines.push(
    `| Concreteness (per 100w) | ${agg.avgGoldenConcreteness} | ${agg.avgGeneratedConcreteness} | |`,
  );
  lines.push(
    `| Anti-tells | ${agg.totalGoldenAntiTells} | ${agg.totalGeneratedAntiTells} | |`,
  );
  lines.push(
    `| Meta-coda | — | ${agg.totalGeneratedMetaCoda} | should be 0 |`,
  );
  lines.push(``);
  lines.push(
    `## Timings\n\n- Extraction: ${(agg.extractionMs / 1000).toFixed(1)}s\n- Answer synth: ${(agg.synthesisMs / 1000).toFixed(1)}s\n- Draft generation: ${(agg.draftMs / 1000).toFixed(1)}s\n- Total: ${(agg.totalMs / 1000).toFixed(1)}s\n`,
  );
  if (agg.thinGateEnabled || agg.forceThinAnswers !== null) {
    lines.push(`## Thin-answer gate\n`);
    if (agg.forceThinAnswers !== null) {
      lines.push(
        `- Force-thin: truncated all synth answers to ${agg.forceThinAnswers} words before drafting.`,
      );
    }
    if (agg.thinGateEnabled) {
      lines.push(
        `- Gate ON: graded ${agg.thinGateTotalAnswers} answers in ${(agg.thinGateGradeMs / 1000).toFixed(1)}s`,
      );
      lines.push(
        `- Heuristic-thin (<50w): ${agg.thinGateHeuristicThinCount} · LLM-flagged: ${agg.thinGateLlmFlaggedCount} · Expanded: ${agg.thinGateExpandedCount}`,
      );
      lines.push(
        `- Expansion elapsed: ${(agg.thinGateExpandMs / 1000).toFixed(1)}s`,
      );
    }
    lines.push(
      `- Avg answer word count into draft stage: ${agg.avgAnswerWcAfterGate}`,
    );
    lines.push(``);
  }
  if (args.failures.length > 0) {
    lines.push(`## Failures\n`);
    for (const f of args.failures) lines.push(`- ${f}`);
    lines.push(``);
  }
  lines.push(`## Per-criterium side-by-side\n`);
  for (const s of args.pairs) {
    lines.push(`### ${s.werkprocesTitel} · ${s.criteriumTitel}\n`);
    lines.push(
      `\`criteriumId: ${s.criteriumId}\`  ·  golden ${s.goldenWc}w conc ${s.goldenConcreteness} anti ${s.goldenAntiTells}  ·  generated ${s.generatedWc ?? "—"}w conc ${s.generatedConcreteness ?? "—"} anti ${s.generatedAntiTells ?? "—"} meta ${s.generatedMetaCoda ?? "—"}  ·  length Δ ${s.lengthDeltaPct === null ? "—" : `${s.lengthDeltaPct > 0 ? "+" : ""}${s.lengthDeltaPct}%`}\n`,
    );
    lines.push(`**Reconstructed kandidaat answer** (synthetic input):`);
    lines.push(`> ${s.rawAnswer.replace(/\n/g, "\n> ")}\n`);
    lines.push(`**Golden bewijs** (from real portfolio):`);
    lines.push(`> ${s.goldenBewijs.replace(/\n/g, "\n> ")}\n`);
    if (s.generatedBewijs) {
      lines.push(`**Generated bewijs** (from our harness):`);
      lines.push(`> ${s.generatedBewijs.replace(/\n/g, "\n> ")}\n`);
    } else {
      lines.push(
        `**Generated bewijs**: _(missing — our generator didn't emit a bewijs for this criteriumId)_\n`,
      );
    }
  }
  return `${lines.join("\n")}\n`;
}
