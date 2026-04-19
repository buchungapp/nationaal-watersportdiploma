// Single-portfolio eval runner (thin CLI wrapper around eval-runner.ts).
//
// Usage (from repo root):
//   pnpm -C apps/web corpus:eval <anonymizedFile.json> <profielTitel>
// Example:
//   pnpm -C apps/web corpus:eval alle_niveau_3_bob.json "Instructeur 3"

import { withDatabase } from "@nawadi/core";
import { runEval } from "./eval-runner.ts";

const PGURI =
  process.env.PGURI ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
const flags = args.filter((a) => a.startsWith("--"));
const [fileArg, profielTitelArg] = positional;

if (!fileArg || !profielTitelArg) {
  console.error(
    'Usage: eval.ts <anonymizedFile.json> <profielTitel> [--thin-gate] [--force-thin=N]\nExample: eval.ts alle_niveau_3_bob.json "Instructeur 3"',
  );
  process.exit(1);
}

const thinGate = flags.includes("--thin-gate");
const forceThinRaw = flags.find((f) => f.startsWith("--force-thin="))?.split("=")[1];
const forceThin =
  forceThinRaw && Number.isFinite(Number(forceThinRaw)) && Number(forceThinRaw) > 0
    ? Math.floor(Number(forceThinRaw))
    : null;

if (!process.env.AI_GATEWAY_API_KEY) {
  console.error(
    "AI_GATEWAY_API_KEY not set. Add to apps/web/.env.local and re-run.",
  );
  process.exit(1);
}

await withDatabase({ connectionString: PGURI }, async () => {
  const result = await runEval({
    portfolioFile: fileArg,
    profielTitel: profielTitelArg,
    thinAnswerGate: thinGate,
    forceThinAnswers: forceThin,
  });

  if (result.skipped) {
    console.error(`SKIPPED: ${result.skipped.reason}`);
    process.exit(1);
  }

  const agg = result.aggregates;
  console.log(`\nReport: ${result.reportPath}`);
  console.log(
    `Aggregates: coverage ${agg.coverageRatio.toFixed(1)}%, length Δ ${agg.avgLengthDeltaPct > 0 ? "+" : ""}${agg.avgLengthDeltaPct}%, concreteness golden ${agg.avgGoldenConcreteness} vs gen ${agg.avgGeneratedConcreteness}, anti-tells gen ${agg.totalGeneratedAntiTells}, meta-coda gen ${agg.totalGeneratedMetaCoda}`,
  );
});
