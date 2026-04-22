// Walks every matrix-*/aggregates.json in .tmp/portfolio-corpus/reports/ and
// prints a time-ordered table of run summaries. Same file rewritten each time
// to .tmp/portfolio-corpus/reports/history.md.
//
// Purpose: one-glance "did the last run improve or regress?" — matched to the
// "simple, daily-tracked metrics" advice. Pays off when we have 3+ matrix
// runs to compare.
//
// Run:
//   pnpm -C apps/web corpus:eval:history

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPORTS_DIR } from "./shared.ts";

type AggregatesPayload = {
  ranAt: string;
  timestamp: string;
  matrixDir: string;
  tag?: string;
  retrievalEnabled?: boolean;
  retrievalMode?: "inspiration" | "fewshot" | null;
  retrievalFraming?: "strict" | "loose" | null;
  retrievalMaxResults?: number | null;
  concurrency?: number;
  wallTimeSec?: number;
  summary?: {
    runs: number;
    skippedCount: number;
    avgLengthDeltaPct: number;
    avgGoldenConcreteness: number;
    avgGeneratedConcreteness: number;
    avgCoverageRatio: number;
    totalAntiTells: number;
    totalMetaCoda: number;
  };
  pipeline?: {
    cachedCount: number;
    freshCount: number;
    totalExtractionSec: number;
    totalSynthesisSec: number;
    totalDraftSec: number;
    avgSynthAnswerWc: number;
    totalRetrievalCalls: number;
    totalChunksReturned: number;
    avgRetrievedChunkWc: number;
    avgRetrievedChunkConcreteness: number;
  };
  // Older runs may only have legacy shape — handled defensively below.
  entries?: unknown[];
};

const dirs = readdirSync(REPORTS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("matrix-"))
  .map((d) => d.name)
  .sort();

if (dirs.length === 0) {
  console.log(
    "No matrix-* directories in .tmp/portfolio-corpus/reports/. Run `pnpm corpus:eval:matrix` first.",
  );
  process.exit(0);
}

type Row = {
  ranAt: string;
  tag: string;
  retrieval: string;
  runs: number;
  skipped: number;
  lengthDelta: number;
  concGolden: number;
  concGen: number;
  concRatio: number;
  coverage: number;
  antiTells: number;
  metaCoda: number;
  wallSec: number;
  avgSynthWc: number;
  avgRetWc: string;
  avgRetConc: string;
  matrixDir: string;
};

const rows: Row[] = [];

for (const name of dirs) {
  const aggPath = join(REPORTS_DIR, name, "aggregates.json");
  try {
    const p = JSON.parse(readFileSync(aggPath, "utf8")) as AggregatesPayload;
    const entries = Array.isArray(p.entries) ? p.entries : [];
    // Prefer the precomputed summary; fall back to re-computing from entries
    // for legacy runs that don't have one.
    const summary =
      p.summary ??
      (() => {
        type LegacyEntry = { aggregates: Record<string, number> };
        const legacyEntries = entries as LegacyEntry[];
        const n = legacyEntries.length;
        if (n === 0) return null;
        const sum = (k: string) =>
          legacyEntries.reduce((s, e) => s + (e.aggregates[k] ?? 0), 0);
        return {
          runs: n,
          skippedCount: 0,
          avgLengthDeltaPct:
            Math.round((sum("avgLengthDeltaPct") / n) * 10) / 10,
          avgGoldenConcreteness:
            Math.round((sum("avgGoldenConcreteness") / n) * 10) / 10,
          avgGeneratedConcreteness:
            Math.round((sum("avgGeneratedConcreteness") / n) * 10) / 10,
          avgCoverageRatio: Math.round((sum("coverageRatio") / n) * 10) / 10,
          totalAntiTells: sum("totalGeneratedAntiTells"),
          totalMetaCoda: sum("totalGeneratedMetaCoda"),
        };
      })();
    if (!summary) continue;
    const concRatio =
      summary.avgGoldenConcreteness > 0
        ? Math.round(
            (summary.avgGeneratedConcreteness / summary.avgGoldenConcreteness) *
              1000,
          ) / 10
        : 0;
    rows.push({
      ranAt: p.ranAt,
      tag: p.tag ?? "—",
      retrieval:
        p.retrievalEnabled === true
          ? `ON${p.retrievalMode ? ` (${p.retrievalMode}${p.retrievalFraming ? `/${p.retrievalFraming}` : ""}${p.retrievalMaxResults ? `/top-${p.retrievalMaxResults}` : ""})` : ""}`
          : p.retrievalEnabled === false
            ? "OFF"
            : "?",
      runs: summary.runs,
      skipped: summary.skippedCount,
      lengthDelta: summary.avgLengthDeltaPct,
      concGolden: summary.avgGoldenConcreteness,
      concGen: summary.avgGeneratedConcreteness,
      concRatio,
      coverage: summary.avgCoverageRatio,
      antiTells: summary.totalAntiTells,
      metaCoda: summary.totalMetaCoda,
      wallSec: p.wallTimeSec ?? 0,
      avgSynthWc: p.pipeline?.avgSynthAnswerWc ?? 0,
      avgRetWc:
        p.pipeline && p.pipeline.totalChunksReturned > 0
          ? String(p.pipeline.avgRetrievedChunkWc)
          : "—",
      avgRetConc:
        p.pipeline && p.pipeline.totalChunksReturned > 0
          ? String(p.pipeline.avgRetrievedChunkConcreteness)
          : "—",
      matrixDir: name,
    });
  } catch (e) {
    console.error(
      `  ! Could not parse ${aggPath}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

rows.sort((a, b) => a.ranAt.localeCompare(b.ranAt));

const lines: string[] = [];
lines.push(`# Eval matrix history`);
lines.push(``);
lines.push(`Generated: ${new Date().toISOString()}  ·  ${rows.length} runs`);
lines.push(``);
lines.push(
  `| Ran | Tag | Retrieval | Runs (skip) | Length Δ | Conc golden→gen (ratio) | Coverage | Anti | Meta | Wall | Synth wc | Ret wc | Ret conc | Matrix dir |`,
);
lines.push(`|---|---|---|---|---|---|---|---|---|---|---|---|---|---|`);
for (const r of rows) {
  const ran = r.ranAt.replace("T", " ").slice(0, 16);
  const len = `${r.lengthDelta > 0 ? "+" : ""}${r.lengthDelta}%`;
  const conc = `${r.concGolden} → ${r.concGen} (${r.concRatio}%)`;
  lines.push(
    `| ${ran} | ${r.tag} | ${r.retrieval} | ${r.runs}${r.skipped > 0 ? ` (−${r.skipped})` : ""} | ${len} | ${conc} | ${r.coverage}% | ${r.antiTells} | ${r.metaCoda} | ${r.wallSec}s | ${r.avgSynthWc} | ${r.avgRetWc} | ${r.avgRetConc} | ${r.matrixDir} |`,
  );
}
lines.push(``);
lines.push(`## Legend`);
lines.push(``);
lines.push(
  `- **Length Δ** — percent difference between generated and golden bewijs lengths, matrix-wide average. Target: near 0%.`,
);
lines.push(
  `- **Conc golden→gen (ratio)** — generated concreteness as percent of golden. 100% = match.`,
);
lines.push(
  `- **Retrieval** — Stage B gate. OFF = pure Stage A (prompts + few-shot, no ai_corpus retrieval).`,
);
lines.push(
  `- **Wall** — total matrix runtime in seconds (lower when golden is cached).`,
);
lines.push(
  `- **Ret wc / Ret conc** — average word count and quality_score of the chunks retrieval returned (only when Stage B enabled).`,
);

const outPath = join(REPORTS_DIR, "history.md");
writeFileSync(outPath, `${lines.join("\n")}\n`);
console.log(`Wrote ${outPath}`);
console.log("");
for (const line of lines) console.log(line);
