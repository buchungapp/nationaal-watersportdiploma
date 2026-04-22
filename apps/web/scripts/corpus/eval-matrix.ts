// Multi-portfolio eval runner. Runs the matrix from eval-matrix.config.ts in
// parallel (bounded), aggregates per-niveau + global, and writes:
//   - .tmp/portfolio-corpus/reports/matrix-<timestamp>/matrix.md
//   - .tmp/portfolio-corpus/reports/matrix-<timestamp>/<portfolio>.md per entry
//   - .tmp/portfolio-corpus/reports/matrix-<timestamp>/aggregates.json
//   - .tmp/portfolio-corpus/reports/latest.json (symlink target for comparisons)
//
// If a previous run's aggregates.json exists at `latest.json`, this run
// renders a diff column in the dashboard so regressions are visible.
//
// Usage:
//   pnpm -C apps/web corpus:eval:matrix [--concurrency=2]

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { withDatabase } from "@nawadi/core";
import pLimit from "p-limit";
import { EVAL_MATRIX, type MatrixEntry } from "./eval-matrix.config.ts";
import {
  type EvalAggregates,
  type EvalResult,
  runEval,
} from "./eval-runner.ts";
import { REPORTS_DIR } from "./shared.ts";

const PGURI =
  process.env.PGURI ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

// ---- args ----
const args = process.argv.slice(2);
const concurrencyArg = args
  .find((a) => a.startsWith("--concurrency="))
  ?.split("=")[1];
const CONCURRENCY = Math.max(1, Math.min(5, Number(concurrencyArg) || 2));

// Retrieval gate for the matrix. OFF by default — tests Stage A only. Enable
// via `--retrieval` or `EVAL_ENABLE_RETRIEVAL=true` when running a Stage B
// ablation. Keeps the Stage A noise floor measurement clean.
const RETRIEVAL_ENABLED =
  args.includes("--retrieval") || process.env.EVAL_ENABLE_RETRIEVAL === "true";
// Stage B ablation knobs.
const RETRIEVAL_MAX_RESULTS = Math.max(
  1,
  Math.min(
    10,
    Number(args.find((a) => a.startsWith("--top="))?.split("=")[1] ?? "2"),
  ),
);
const RETRIEVAL_FRAMING: "strict" | "loose" = args.includes("--loose")
  ? "loose"
  : "strict";
// Stage B ablation: where retrieval chunks land in the prompt.
// "inspiration" (default) = user-prompt inspiration block (Stage B as first shipped).
// "fewshot" = system-prompt few-shot slot (replaces hand-picked examples,
//             padded with FEW_SHOT_EXAMPLES when retrieval returns < 3).
const RETRIEVAL_MODE: "inspiration" | "fewshot" = (() => {
  const raw = args.find((a) => a.startsWith("--mode="))?.split("=")[1];
  if (raw === "fewshot" || raw === "inspiration") return raw;
  return "inspiration";
})();
// Thin-answer gate (Stage F ablation #3): LLM grades each synth answer and
// expands thin ones before drafting. Off by default.
const THIN_GATE_ENABLED = args.includes("--thin-gate");
// Force-truncate synth answers to N words before drafting, to simulate thin
// input. Used with/without --thin-gate to measure recovery. 0/absent = off.
const FORCE_THIN_ANSWERS: number | null = (() => {
  const raw = args.find((a) => a.startsWith("--force-thin="))?.split("=")[1];
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
})();

// Optional tag in report filenames, e.g. "noise-run-1" or "stage-b-top1".
const TAG_ARG =
  args.find((a) => a.startsWith("--tag="))?.split("=")[1] ??
  (RETRIEVAL_ENABLED ? "stage-b" : "stage-a");

if (!process.env.AI_GATEWAY_API_KEY) {
  console.error(
    "AI_GATEWAY_API_KEY not set. Add to apps/web/.env.local and re-run.",
  );
  process.exit(1);
}

// ---- output dir ----
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const matrixDir = join(REPORTS_DIR, `matrix-${timestamp}`);
mkdirSync(matrixDir, { recursive: true });
const latestAggPath = join(REPORTS_DIR, "latest.json");

// ---- load baseline if present ----
type BaselineEntry = {
  portfolio: string;
  profielTitel: string;
  aggregates: EvalAggregates;
};
let baseline: BaselineEntry[] | null = null;
if (existsSync(latestAggPath)) {
  try {
    const parsed = JSON.parse(readFileSync(latestAggPath, "utf8")) as {
      entries: BaselineEntry[];
    };
    baseline = parsed.entries;
    console.log(
      `Loaded baseline from ${latestAggPath} (${baseline.length} entries)`,
    );
  } catch (_e) {
    console.warn(
      `Could not parse ${latestAggPath}; continuing without baseline.`,
    );
  }
}

// ---- run ----
console.log(
  `Matrix: ${EVAL_MATRIX.length} entries (concurrency=${CONCURRENCY}, retrieval=${RETRIEVAL_ENABLED ? `ON top-${RETRIEVAL_MAX_RESULTS} ${RETRIEVAL_FRAMING} mode=${RETRIEVAL_MODE}` : "OFF"}, thin-gate=${THIN_GATE_ENABLED ? "ON" : "OFF"}${FORCE_THIN_ANSWERS !== null ? `, force-thin=${FORCE_THIN_ANSWERS}w` : ""}, tag=${TAG_ARG})`,
);

const limit = pLimit(CONCURRENCY);
const runStartedAt = Date.now();
const results: Array<EvalResult & { entry: MatrixEntry }> = await withDatabase(
  { connectionString: PGURI },
  async () =>
    Promise.all(
      EVAL_MATRIX.map((entry) =>
        limit(async () => {
          const log = (line: string) =>
            console.log(`[${entry.portfolio}] ${line}`);
          log(`starting... (profiel: ${entry.profielTitel})`);
          try {
            const r = await runEval({
              portfolioFile: entry.portfolio,
              profielTitel: entry.profielTitel,
              outputDir: matrixDir,
              tag: TAG_ARG,
              log,
              retrievalEnabled: RETRIEVAL_ENABLED,
              retrievalMaxResults: RETRIEVAL_MAX_RESULTS,
              retrievalFraming: RETRIEVAL_FRAMING,
              retrievalMode: RETRIEVAL_MODE,
              thinAnswerGate: THIN_GATE_ENABLED,
              forceThinAnswers: FORCE_THIN_ANSWERS,
            });
            log(
              r.skipped
                ? `SKIPPED: ${r.skipped.reason}`
                : `done in ${(r.aggregates.totalMs / 1000).toFixed(1)}s`,
            );
            return { ...r, entry };
          } catch (e) {
            const reason = e instanceof Error ? e.message : String(e);
            log(`FAILED: ${reason}`);
            return {
              portfolioFile: entry.portfolio,
              profielTitel: entry.profielTitel,
              pageCount: 0,
              charCount: 0,
              niveauRang: entry.niveau,
              aggregates: {
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
                goldenSource: "freshly_extracted" as const,
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
              },
              pairs: [],
              reportPath: "",
              skipped: { reason: reason },
              entry,
            };
          }
        }),
      ),
    ),
);
const runElapsedMs = Date.now() - runStartedAt;

// ---- dashboard ----

function findBaseline(
  portfolio: string,
  profielTitel: string,
): EvalAggregates | null {
  if (!baseline) return null;
  return (
    baseline.find(
      (b) => b.portfolio === portfolio && b.profielTitel === profielTitel,
    )?.aggregates ?? null
  );
}

function _fmtDelta(current: number, prev: number | null, unit = ""): string {
  if (prev === null) return `${current}${unit}`;
  const diff = Math.round((current - prev) * 10) / 10;
  const sign = diff > 0 ? "+" : "";
  const emoji = Math.abs(diff) < 0.1 ? "" : "";
  return `${current}${unit} (Δ ${sign}${diff}${unit}${emoji})`;
}

function _numberOrZero(n: number | null | undefined): number {
  return n ?? 0;
}

type NiveauAggregate = {
  niveau: number;
  runs: number;
  avgLengthDeltaPct: number;
  avgGoldenConcreteness: number;
  avgGeneratedConcreteness: number;
  avgCoverageRatio: number;
  totalAntiTells: number;
  totalMetaCoda: number;
};

const ranResults = results.filter((r) => !r.skipped);

const byNiveau = new Map<number, NiveauAggregate>();
for (const r of ranResults) {
  const n = r.niveauRang || r.entry.niveau;
  const current = byNiveau.get(n) ?? {
    niveau: n,
    runs: 0,
    avgLengthDeltaPct: 0,
    avgGoldenConcreteness: 0,
    avgGeneratedConcreteness: 0,
    avgCoverageRatio: 0,
    totalAntiTells: 0,
    totalMetaCoda: 0,
  };
  current.runs += 1;
  current.avgLengthDeltaPct += r.aggregates.avgLengthDeltaPct;
  current.avgGoldenConcreteness += r.aggregates.avgGoldenConcreteness;
  current.avgGeneratedConcreteness += r.aggregates.avgGeneratedConcreteness;
  current.avgCoverageRatio += r.aggregates.coverageRatio;
  current.totalAntiTells += r.aggregates.totalGeneratedAntiTells;
  current.totalMetaCoda += r.aggregates.totalGeneratedMetaCoda;
  byNiveau.set(n, current);
}
for (const [, agg] of byNiveau) {
  agg.avgLengthDeltaPct =
    Math.round((agg.avgLengthDeltaPct / agg.runs) * 10) / 10;
  agg.avgGoldenConcreteness =
    Math.round((agg.avgGoldenConcreteness / agg.runs) * 10) / 10;
  agg.avgGeneratedConcreteness =
    Math.round((agg.avgGeneratedConcreteness / agg.runs) * 10) / 10;
  agg.avgCoverageRatio =
    Math.round((agg.avgCoverageRatio / agg.runs) * 10) / 10;
}

const lines: string[] = [];
lines.push(`# Eval matrix — ${timestamp}\n`);
lines.push(
  `- Entries: ${EVAL_MATRIX.length} (${ranResults.length} ran, ${results.length - ranResults.length} skipped/failed)`,
);
lines.push(`- Wall time: ${(runElapsedMs / 1000).toFixed(1)}s`);
lines.push(`- Concurrency: ${CONCURRENCY}`);
lines.push(`- Baseline: ${baseline ? "loaded" : "none"}`);
lines.push(`- Tag: ${TAG_ARG}`);
lines.push(`- Retrieval (Stage B): ${RETRIEVAL_ENABLED ? "ON" : "OFF"}`);
lines.push(``);

// Niveau-level summary
lines.push(`## Per-niveau summary (averages across runs)\n`);
lines.push(
  `| Niveau | Runs | Length Δ | Golden conc | Generated conc | Coverage | Anti-tells | Meta-coda |`,
);
lines.push(`|---|---|---|---|---|---|---|---|`);
for (const agg of [...byNiveau.values()].sort((a, b) => a.niveau - b.niveau)) {
  lines.push(
    `| N${agg.niveau} | ${agg.runs} | ${agg.avgLengthDeltaPct > 0 ? "+" : ""}${agg.avgLengthDeltaPct}% | ${agg.avgGoldenConcreteness} | ${agg.avgGeneratedConcreteness} | ${agg.avgCoverageRatio}% | ${agg.totalAntiTells} | ${agg.totalMetaCoda} |`,
  );
}
lines.push(``);

// Per-portfolio table
lines.push(`## Per-portfolio\n`);
lines.push(
  `| Niveau | Portfolio | Status | Pairs | Coverage | Length Δ | Conc G→gen | Anti | Meta | Time |`,
);
lines.push(`|---|---|---|---|---|---|---|---|---|---|`);
for (const r of results) {
  if (r.skipped) {
    lines.push(
      `| N${r.entry.niveau} | ${r.entry.portfolio} | ⏭ SKIPPED | — | — | — | — | — | — | — |`,
    );
    lines.push(`|  |  | _${r.skipped.reason}_ |  |  |  |  |  |  |  |`);
    continue;
  }
  const agg = r.aggregates;
  const prev = findBaseline(r.entry.portfolio, r.entry.profielTitel);
  const lenCell = prev
    ? `${agg.avgLengthDeltaPct > 0 ? "+" : ""}${agg.avgLengthDeltaPct}% (was ${prev.avgLengthDeltaPct > 0 ? "+" : ""}${prev.avgLengthDeltaPct}%)`
    : `${agg.avgLengthDeltaPct > 0 ? "+" : ""}${agg.avgLengthDeltaPct}%`;
  const concCell = prev
    ? `${agg.avgGoldenConcreteness} → ${agg.avgGeneratedConcreteness} (was ${prev.avgGeneratedConcreteness})`
    : `${agg.avgGoldenConcreteness} → ${agg.avgGeneratedConcreteness}`;
  lines.push(
    `| N${r.niveauRang} | ${r.entry.portfolio} | ✅ | ${agg.pairsExtracted} | ${agg.coverageRatio.toFixed(0)}% | ${lenCell} | ${concCell} | ${agg.totalGeneratedAntiTells} | ${agg.totalGeneratedMetaCoda} | ${(agg.totalMs / 1000).toFixed(0)}s |`,
  );
}
lines.push(``);

// Matrix-wide aggregate
const runnable = ranResults;
const matrixAvg = {
  runs: runnable.length,
  avgLengthDeltaPct:
    runnable.length === 0
      ? 0
      : Math.round(
          (runnable.reduce((s, r) => s + r.aggregates.avgLengthDeltaPct, 0) /
            runnable.length) *
            10,
        ) / 10,
  avgGoldenConcreteness:
    runnable.length === 0
      ? 0
      : Math.round(
          (runnable.reduce(
            (s, r) => s + r.aggregates.avgGoldenConcreteness,
            0,
          ) /
            runnable.length) *
            10,
        ) / 10,
  avgGeneratedConcreteness:
    runnable.length === 0
      ? 0
      : Math.round(
          (runnable.reduce(
            (s, r) => s + r.aggregates.avgGeneratedConcreteness,
            0,
          ) /
            runnable.length) *
            10,
        ) / 10,
  avgCoverageRatio:
    runnable.length === 0
      ? 0
      : Math.round(
          (runnable.reduce((s, r) => s + r.aggregates.coverageRatio, 0) /
            runnable.length) *
            10,
        ) / 10,
  totalAntiTells: runnable.reduce(
    (s, r) => s + r.aggregates.totalGeneratedAntiTells,
    0,
  ),
  totalMetaCoda: runnable.reduce(
    (s, r) => s + r.aggregates.totalGeneratedMetaCoda,
    0,
  ),
};

lines.push(`## Matrix aggregate (across all runnable entries)\n`);
lines.push(`| Metric | Value |`);
lines.push(`|---|---|`);
lines.push(`| Runs | ${matrixAvg.runs} |`);
lines.push(
  `| Avg length Δ | ${matrixAvg.avgLengthDeltaPct > 0 ? "+" : ""}${matrixAvg.avgLengthDeltaPct}% |`,
);
lines.push(`| Avg golden concreteness | ${matrixAvg.avgGoldenConcreteness} |`);
lines.push(
  `| Avg generated concreteness | ${matrixAvg.avgGeneratedConcreteness} |`,
);
lines.push(`| Avg coverage | ${matrixAvg.avgCoverageRatio}% |`);
lines.push(`| Total anti-tells | ${matrixAvg.totalAntiTells} |`);
lines.push(`| Total meta-coda | ${matrixAvg.totalMetaCoda} |`);
lines.push(``);

// Pipeline-stage telemetry — Stage E visibility into intermediates.
// When numbers move between runs, these tell you which stage moved.
const pipe = {
  cachedCount: runnable.filter((r) => r.aggregates.goldenSource === "cached")
    .length,
  freshCount: runnable.filter(
    (r) => r.aggregates.goldenSource === "freshly_extracted",
  ).length,
  totalExtractionSec: Math.round(
    runnable.reduce((s, r) => s + r.aggregates.extractionMs, 0) / 1000,
  ),
  totalSynthesisSec: Math.round(
    runnable.reduce((s, r) => s + r.aggregates.synthesisMs, 0) / 1000,
  ),
  totalDraftSec: Math.round(
    runnable.reduce((s, r) => s + r.aggregates.draftMs, 0) / 1000,
  ),
  avgSynthAnswerWc:
    runnable.length === 0
      ? 0
      : Math.round(
          runnable.reduce((s, r) => s + r.aggregates.avgSynthAnswerWc, 0) /
            runnable.length,
        ),
  totalRetrievalCalls: runnable.reduce(
    (s, r) => s + r.aggregates.retrievalCallsIssued,
    0,
  ),
  totalChunksReturned: runnable.reduce(
    (s, r) => s + r.aggregates.retrievalChunksReturned,
    0,
  ),
  avgRetrievedChunkWc:
    runnable.length === 0
      ? 0
      : Math.round(
          (runnable.reduce((s, r) => s + r.aggregates.avgRetrievedChunkWc, 0) /
            runnable.length) *
            10,
        ) / 10,
  avgRetrievedChunkConcreteness:
    runnable.length === 0
      ? 0
      : Math.round(
          (runnable.reduce(
            (s, r) => s + r.aggregates.avgRetrievedChunkConcreteness,
            0,
          ) /
            runnable.length) *
            10,
        ) / 10,
};
lines.push(`## Pipeline telemetry\n`);
lines.push(`| Stage | Value |`);
lines.push(`|---|---|`);
lines.push(
  `| Golden: cached vs fresh | ${pipe.cachedCount} cached · ${pipe.freshCount} freshly extracted |`,
);
lines.push(`| Total extraction time | ${pipe.totalExtractionSec}s |`);
lines.push(`| Total synthesis time | ${pipe.totalSynthesisSec}s |`);
lines.push(`| Total draft time | ${pipe.totalDraftSec}s |`);
lines.push(`| Avg synth-answer words | ${pipe.avgSynthAnswerWc} |`);
lines.push(
  `| Retrieval calls (criteria queried) | ${pipe.totalRetrievalCalls} |`,
);
lines.push(`| Retrieval chunks returned | ${pipe.totalChunksReturned} |`);
lines.push(
  `| Avg retrieved chunk words | ${pipe.avgRetrievedChunkWc > 0 ? pipe.avgRetrievedChunkWc : "—"} |`,
);
lines.push(
  `| Avg retrieved chunk concreteness | ${pipe.avgRetrievedChunkConcreteness > 0 ? pipe.avgRetrievedChunkConcreteness : "—"} |`,
);
lines.push(``);

lines.push(`## Per-portfolio reports\n`);
for (const r of results) {
  if (r.reportPath) {
    lines.push(`- [${r.entry.portfolio}](./${r.reportPath.split("/").pop()})`);
  }
}
lines.push(``);

const matrixReportPath = join(matrixDir, "matrix.md");
writeFileSync(matrixReportPath, `${lines.join("\n")}\n`);

// Machine-readable aggregates for future diffs + history view
const aggregatesPayload = {
  ranAt: new Date().toISOString(),
  timestamp,
  matrixDir,
  tag: TAG_ARG,
  retrievalEnabled: RETRIEVAL_ENABLED,
  retrievalMaxResults: RETRIEVAL_ENABLED ? RETRIEVAL_MAX_RESULTS : null,
  retrievalFraming: RETRIEVAL_ENABLED ? RETRIEVAL_FRAMING : null,
  retrievalMode: RETRIEVAL_ENABLED ? RETRIEVAL_MODE : null,
  thinGateEnabled: THIN_GATE_ENABLED,
  forceThinAnswers: FORCE_THIN_ANSWERS,
  concurrency: CONCURRENCY,
  wallTimeSec: Math.round(runElapsedMs / 1000),
  summary: {
    runs: matrixAvg.runs,
    skippedCount: results.length - ranResults.length,
    avgLengthDeltaPct: matrixAvg.avgLengthDeltaPct,
    avgGoldenConcreteness: matrixAvg.avgGoldenConcreteness,
    avgGeneratedConcreteness: matrixAvg.avgGeneratedConcreteness,
    avgCoverageRatio: matrixAvg.avgCoverageRatio,
    totalAntiTells: matrixAvg.totalAntiTells,
    totalMetaCoda: matrixAvg.totalMetaCoda,
  },
  pipeline: pipe,
  entries: results
    .filter((r) => !r.skipped && !r.failures?.length)
    .map((r) => ({
      portfolio: r.entry.portfolio,
      profielTitel: r.entry.profielTitel,
      niveau: r.niveauRang,
      aggregates: r.aggregates,
    })),
};
const aggPath = join(matrixDir, "aggregates.json");
writeFileSync(aggPath, `${JSON.stringify(aggregatesPayload, null, 2)}\n`);
writeFileSync(latestAggPath, `${JSON.stringify(aggregatesPayload, null, 2)}\n`);

console.log(`\nDashboard: ${matrixReportPath}`);
console.log(`Machine-readable: ${aggPath}`);
console.log(`Latest baseline: ${latestAggPath}`);
console.log(
  `\n${matrixAvg.runs} runs · avg length Δ ${matrixAvg.avgLengthDeltaPct > 0 ? "+" : ""}${matrixAvg.avgLengthDeltaPct}% · avg coverage ${matrixAvg.avgCoverageRatio}% · conc ${matrixAvg.avgGoldenConcreteness}→${matrixAvg.avgGeneratedConcreteness}`,
);
