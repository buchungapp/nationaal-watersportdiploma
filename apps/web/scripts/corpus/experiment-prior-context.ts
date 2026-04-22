// Experiment: when a kandidaat writes their next-level portfolio, their
// PREVIOUS portfolios are a gold mine of voice, vision, and recurring
// situations. Current product only takes a fresh profiel + answers. This
// script tests whether injecting prior-portfolio-derived context into the
// draft prompt produces meaningfully different bewijs.
//
// Perfect test case: Maurits Misana, who has portfolios across THREE levels
// as the same person: alle_niveau_3_maurits (full N3), 4.1_maurits (partial
// N4, kerntaak 4.1), and 5.1_maurits (current N5 target). This is the actual
// "I've done my 3 and my 4.1 before, now I'm writing 5.1" scenario.
//
// IMPORTANT: alle_niveau_4_maurits is a DIFFERENT person (coincidental first
// name). Do NOT use it as prior context.
//
// Pipeline:
//   1. Load his N3 + N4 anonymised text from ai_corpus.source.
//   2. LLM call: extract structured "prior context" — voice profile, vision
//      fragments, recurring situations, evolution markers.
//   3. Load the golden cache for his 5.1 (built in Stage E).
//   4. Run draft generation for one representative criterium TWICE:
//      a. Without prior context (Stage A baseline)
//      b. With prior context injected into the system prompt
//   5. Write a side-by-side markdown report for eyeball review.
//
// Run:
//   pnpm -C apps/web corpus:experiment:prior-context

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gateway } from "@ai-sdk/gateway";
import { withDatabase } from "@nawadi/core";
import { generateObject } from "ai";
import pg from "pg";
import { Agent, setGlobalDispatcher } from "undici";
import { z } from "zod";
import { runDraftGeneration } from "./portfolio-generator/generator.ts";

// Pinned model id — eval reproducibility trumps bleeding-edge. Bump
// deliberately when comparing new-model results against historical
// baselines.
const MODEL_ID = "anthropic/claude-sonnet-4-5";

import {
  concretenessPer100,
  loadRubricByProfielTitel,
  wordCount,
} from "./eval-runner.ts";
import type { Question } from "./portfolio-generator/schemas.ts";
import {
  ANONYMIZED_DIR,
  type AnonymizedPortfolio,
  GOLDEN_DIR,
  REPORTS_DIR,
} from "./shared.ts";

setGlobalDispatcher(
  new Agent({
    headersTimeout: 600_000,
    bodyTimeout: 600_000,
    keepAliveTimeout: 600_000,
    connectTimeout: 30_000,
  }),
);

const PGURI =
  process.env.PGURI ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

if (!process.env.AI_GATEWAY_API_KEY) {
  console.error("AI_GATEWAY_API_KEY not set.");
  process.exit(1);
}

// ---- 1. Load prior portfolios from ai_corpus ----

async function loadFromAiCorpus(
  sourceIdentifier: string,
): Promise<{ sourceIdentifier: string; content: string; niveau: number }> {
  const client = new pg.Client({ connectionString: PGURI });
  await client.connect();
  try {
    const res = await client.query<{ content: string; niveauRang: number }>(
      `SELECT content, niveau_rang AS "niveauRang"
       FROM ai_corpus.source
       WHERE source_identifier = $1 AND revoked_at IS NULL`,
      [sourceIdentifier],
    );
    const row = res.rows[0];
    if (!row) {
      throw new Error(`No source ${sourceIdentifier} in ai_corpus.`);
    }
    return {
      sourceIdentifier,
      content: row.content,
      niveau: row.niveauRang,
    };
  } finally {
    await client.end();
  }
}

// For prior portfolios that weren't in the matrix config and therefore weren't
// ingested into ai_corpus (e.g. 4.1_maurits partial), read the anonymised JSON
// directly. Same content, just a different storage location.
function loadFromAnonymizedFile(
  filename: string,
  niveau: number,
): { sourceIdentifier: string; content: string; niveau: number } {
  const path = join(ANONYMIZED_DIR, filename);
  const parsed = JSON.parse(readFileSync(path, "utf8")) as AnonymizedPortfolio;
  return {
    sourceIdentifier: `file:${filename.replace(/\.json$/, "")}`,
    content: parsed.anonymizedText,
    niveau,
  };
}

// ---- 2. Extract structured prior context ----

const PriorContextSchema = z.object({
  voiceProfile: z.object({
    register: z.enum(["informeel", "professioneel-warm", "zakelijk"]),
    tone: z.string(),
    signaturePhrases: z.array(z.string()).min(0).max(10),
    sentencePatterns: z
      .string()
      .describe(
        "How this kandidaat structures sentences: length, rhythm, use of haakjes, etc.",
      ),
  }),
  visionFragments: z
    .array(z.string())
    .min(0)
    .max(8)
    .describe(
      "Distinct one-sentence views this kandidaat holds about lesgeven/training/coaching. Quoted or close-paraphrased from the corpus.",
    ),
  recurringSituations: z
    .array(
      z.object({
        shortLabel: z.string(),
        context: z.string(),
      }),
    )
    .max(8)
    .describe(
      "Specific contexts/situations the kandidaat has described multiple times across prior portfolios. E.g. specific boat types, vaargebieden, cursist archetypes, zeilschool traditions.",
    ),
  evolutionMarkers: z
    .array(z.string())
    .max(6)
    .describe(
      "Sentences like 'vroeger deed ik X, nu doe ik Y' — places where the kandidaat explicitly reflected on their growth. Verbatim or close.",
    ),
  professionalIdentity: z
    .string()
    .describe(
      "One-paragraph summary of how this kandidaat sees themselves professionally.",
    ),
});

async function extractPriorContext(args: {
  priorPortfolios: Array<{
    sourceIdentifier: string;
    content: string;
    niveau: number;
  }>;
}): Promise<z.infer<typeof PriorContextSchema>> {
  const corpus = args.priorPortfolios
    .sort((a, b) => a.niveau - b.niveau)
    .map(
      (p) =>
        `--- EERDER PORTFOLIO (${p.sourceIdentifier}, niveau ${p.niveau}) ---\n${p.content}\n--- EINDE ${p.sourceIdentifier} ---`,
    )
    .join("\n\n");

  const { object } = await generateObject({
    model: gateway(MODEL_ID),
    schema: PriorContextSchema,
    system: `Je leest eerdere PvB-portfolio's van DEZELFDE kandidaat (niveau 3 en/of 4) en extraheert een gestructureerd profiel dat ons helpt om een portfolio op hoger niveau (5) in hun eigen stem te schrijven.

Dit profiel is geen samenvatting. Het is een INSTRUMENT om de stem van deze specifieke persoon te reproduceren.

- voiceProfile: observeer HOE ze schrijven, niet wat ze zeggen. Register, toon, typische zinspatronen, signature phrases die terugkomen.
- visionFragments: kort geformuleerde opvattingen die de kandidaat hanteert over lesgeven/coaching/beoordelen. Liefst bijna verbatim.
- recurringSituations: specifieke contexten die ze vaker hebben beschreven. Kort label + context.
- evolutionMarkers: zinnen waarin de kandidaat zelf reflecteert op hun groei ('ik merkte dat...', 'vroeger deed ik', 'na die ervaring begreep ik').
- professionalIdentity: één paragraaf over hoe deze kandidaat zichzelf als sport-/onderwijs-professional ziet. Synthese.

Gebruik de tokens [KANDIDAAT], [LOCATIE], [VERENIGING], [DATUM] in de output zoals ze in de corpustekst staan.`,
    prompt: `Prior portfolios om te analyseren:\n\n${corpus}\n\nExtraheer het prior-context profiel.`,
    temperature: 0.1,
  });
  return object;
}

// ---- 3. Draft generation with and without prior context ----

function priorContextToSystemPromptFragment(
  ctx: z.infer<typeof PriorContextSchema>,
): string {
  const parts: string[] = [];
  parts.push(`
# PRIOR CONTEXT — dezelfde kandidaat, eerdere portfolio's

Deze kandidaat heeft al eerdere PvB's afgelegd. Gebruik het onderstaande profiel om EIGEN STEM en DOORLOPENDE VISIE in het bewijs te verwerken. Als ze iets eerder hebben gezegd, herken dat in het register en bouw erop voort — maar verzin niets dat niet in hun huidige antwoorden staat.

## Professionele identiteit
${ctx.professionalIdentity}

## Stem
Register: ${ctx.voiceProfile.register}. ${ctx.voiceProfile.tone}
Zinspatronen: ${ctx.voiceProfile.sentencePatterns}
Signature phrases (overneembaar): ${ctx.voiceProfile.signaturePhrases.map((p) => `"${p}"`).join(", ")}

## Visie (overneembare gedachten)
${ctx.visionFragments.map((v) => `- "${v}"`).join("\n")}

## Terugkerende contexten
${ctx.recurringSituations.map((s) => `- ${s.shortLabel}: ${s.context}`).join("\n")}

## Evolutiemarkers
${ctx.evolutionMarkers.map((e) => `- "${e}"`).join("\n")}
`);
  return parts.join("\n");
}

// ---- 4. Run the experiment ----

async function main() {
  console.log("Experiment: prior-portfolio context for Maurits 5.1\n");

  // Load Maurits Misana's prior portfolios: full N3 (ingested) + 4.1 partial
  // (not ingested because it wasn't in the matrix config, load from disk).
  // alle_niveau_4_maurits is a DIFFERENT Maurits — do not use.
  const priorPortfolios = [
    await loadFromAiCorpus("seed:alle_niveau_3_maurits"),
    loadFromAnonymizedFile("4.1_maurits.json", 4),
  ];
  console.log(
    `Loaded ${priorPortfolios.length} prior portfolios (Maurits Misana): ${priorPortfolios.map((p) => `${p.sourceIdentifier} (${p.content.length}ch)`).join(", ")}`,
  );

  // Extract prior context
  console.log("Extracting prior context...");
  const ctxStart = Date.now();
  const priorContext = await extractPriorContext({ priorPortfolios });
  console.log(
    `  done in ${((Date.now() - ctxStart) / 1000).toFixed(1)}s  ·  signaturePhrases=${priorContext.voiceProfile.signaturePhrases.length}  vision=${priorContext.visionFragments.length}  situations=${priorContext.recurringSituations.length}  evolution=${priorContext.evolutionMarkers.length}`,
  );

  // Load the Maurits 5.1 golden cache (built in Stage E)
  const goldenPath = join(GOLDEN_DIR, `5.1_maurits__Instructeur_5.json`);
  if (!existsSync(goldenPath)) {
    throw new Error(
      `No golden cache for 5.1_maurits. Run corpus:eval alle_niveau_3_bob.json or similar first to build caches.`,
    );
  }
  const golden = JSON.parse(readFileSync(goldenPath, "utf8")) as {
    pairs: Array<{
      criteriumId: string;
      criteriumTitel: string;
      werkprocesId: string;
      goldenBewijs: string;
      rawAnswer: string;
    }>;
  };
  console.log(`Loaded ${golden.pairs.length} golden pairs for 5.1_maurits`);

  // Load the Instructeur 5 rubric
  const rubric = await loadRubricByProfielTitel("Instructeur 5");
  if (rubric.status !== "found") {
    throw new Error("Instructeur 5 rubric missing or empty.");
  }
  const tree = rubric.tree;

  // Build Question[] + answers from the golden
  const questions: Question[] = golden.pairs.map((p, i) => ({
    id: `exp-q-${i}`,
    werkprocesId: p.werkprocesId,
    werkprocesTitel:
      tree.werkprocessen.find((w) => w.id === p.werkprocesId)?.titel ?? "",
    criteriumIds: [p.criteriumId],
    prompt: "Experiment: reconstructed question.",
  }));
  const answers = golden.pairs.map((p, i) => ({
    questionId: `exp-q-${i}`,
    answer: p.rawAnswer,
  }));

  // Run TWO draft generations: baseline (no context) + experimental (with context)
  console.log("\nRunning draft generation (baseline — no prior context)...");
  const baselineStart = Date.now();
  const baselineResult = await runDraftGeneration({
    tree,
    questions,
    answers,
    modelId: MODEL_ID,
  });
  console.log(
    `  generated ${baselineResult.drafts.length} werkproces drafts in ${((Date.now() - baselineStart) / 1000).toFixed(1)}s`,
  );

  console.log(
    "\nRunning draft generation (experimental — with prior context injected into system prompt)...",
  );
  const priorFragment = priorContextToSystemPromptFragment(priorContext);
  const expStart = Date.now();
  const experimentalResult = await runDraftGeneration({
    tree,
    questions,
    answers,
    systemPromptExtra: priorFragment,
    modelId: MODEL_ID,
  });
  console.log(
    `  generated ${experimentalResult.drafts.length} werkproces drafts in ${((Date.now() - expStart) / 1000).toFixed(1)}s`,
  );

  // Score each pair
  const baselineByCrit = new Map(
    baselineResult.drafts.flatMap((d) =>
      d.criteria.map((c) => [c.criteriumId, c] as const),
    ),
  );
  const expByCrit = new Map(
    experimentalResult.drafts.flatMap((d) =>
      d.criteria.map((c) => [c.criteriumId, c] as const),
    ),
  );

  type Row = {
    criteriumId: string;
    criteriumTitel: string;
    werkprocesTitel: string;
    rawAnswer: string;
    goldenBewijs: string;
    goldenWc: number;
    goldenConc: number;
    baselineBewijs: string | null;
    baselineWc: number | null;
    baselineConc: number | null;
    experimentalBewijs: string | null;
    experimentalWc: number | null;
    experimentalConc: number | null;
  };

  const rows: Row[] = golden.pairs.map((p) => {
    const wp = tree.werkprocessen.find((w) =>
      w.criteria.some((c) => c.id === p.criteriumId),
    );
    const base = baselineByCrit.get(p.criteriumId)?.bewijs ?? null;
    const exp = expByCrit.get(p.criteriumId)?.bewijs ?? null;
    return {
      criteriumId: p.criteriumId,
      criteriumTitel: p.criteriumTitel,
      werkprocesTitel: wp?.titel ?? "",
      rawAnswer: p.rawAnswer,
      goldenBewijs: p.goldenBewijs,
      goldenWc: wordCount(p.goldenBewijs),
      goldenConc: concretenessPer100(p.goldenBewijs),
      baselineBewijs: base,
      baselineWc: base ? wordCount(base) : null,
      baselineConc: base ? concretenessPer100(base) : null,
      experimentalBewijs: exp,
      experimentalWc: exp ? wordCount(exp) : null,
      experimentalConc: exp ? concretenessPer100(exp) : null,
    };
  });

  const avg = (xs: Array<number | null>): number => {
    const nums = xs.filter((n): n is number => n !== null && !Number.isNaN(n));
    if (nums.length === 0) return 0;
    return (
      Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10
    );
  };

  const summary = {
    goldenAvgWc: avg(rows.map((r) => r.goldenWc)),
    goldenAvgConc: avg(rows.map((r) => r.goldenConc)),
    baselineAvgWc: avg(rows.map((r) => r.baselineWc)),
    baselineAvgConc: avg(rows.map((r) => r.baselineConc)),
    experimentalAvgWc: avg(rows.map((r) => r.experimentalWc)),
    experimentalAvgConc: avg(rows.map((r) => r.experimentalConc)),
  };

  // Write markdown report
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const reportDir = join(REPORTS_DIR, `experiment-prior-context-${timestamp}`);
  mkdirSync(reportDir, { recursive: true });

  const lines: string[] = [];
  lines.push(`# Experiment: prior-portfolio context (Maurits N3+N4 → N5.1)\n`);
  lines.push(
    `Generated: ${new Date().toISOString()}  ·  golden cached, same rawAnswers for both runs\n`,
  );
  lines.push(`## Extracted prior context\n`);
  lines.push(`### Professional identity`);
  lines.push(priorContext.professionalIdentity);
  lines.push(``);
  lines.push(`### Voice`);
  lines.push(`- Register: **${priorContext.voiceProfile.register}**`);
  lines.push(`- Toon: ${priorContext.voiceProfile.tone}`);
  lines.push(`- Zinspatronen: ${priorContext.voiceProfile.sentencePatterns}`);
  lines.push(
    `- Signature phrases: ${priorContext.voiceProfile.signaturePhrases.map((p) => `"${p}"`).join(", ") || "—"}`,
  );
  lines.push(``);
  lines.push(`### Visie-fragmenten`);
  for (const v of priorContext.visionFragments) lines.push(`- "${v}"`);
  lines.push(``);
  lines.push(`### Terugkerende situaties`);
  for (const s of priorContext.recurringSituations)
    lines.push(`- **${s.shortLabel}** — ${s.context}`);
  lines.push(``);
  lines.push(`### Evolutiemarkers`);
  for (const e of priorContext.evolutionMarkers) lines.push(`- "${e}"`);
  lines.push(``);

  lines.push(`## Metrics summary\n`);
  lines.push(`| Column | Avg words | Avg concreteness |`);
  lines.push(`|---|---|---|`);
  lines.push(
    `| Golden (real bewijs) | ${summary.goldenAvgWc} | ${summary.goldenAvgConc} |`,
  );
  lines.push(
    `| Baseline (no prior context) | ${summary.baselineAvgWc} | ${summary.baselineAvgConc} |`,
  );
  lines.push(
    `| Experimental (with prior context) | ${summary.experimentalAvgWc} | ${summary.experimentalAvgConc} |`,
  );
  lines.push(``);

  lines.push(`## Per-criterium side-by-side\n`);
  for (const r of rows) {
    lines.push(`### ${r.werkprocesTitel} · ${r.criteriumTitel}\n`);
    lines.push(
      `golden ${r.goldenWc}w c${r.goldenConc}  ·  baseline ${r.baselineWc ?? "—"}w c${r.baselineConc ?? "—"}  ·  experimental ${r.experimentalWc ?? "—"}w c${r.experimentalConc ?? "—"}\n`,
    );
    lines.push(`**Raw answer (what the kandidaat told us):**`);
    lines.push(`> ${r.rawAnswer.replace(/\n/g, "\n> ")}\n`);
    lines.push(`**Golden (real bewijs from Maurits' 5.1):**`);
    lines.push(`> ${r.goldenBewijs.replace(/\n/g, "\n> ")}\n`);
    if (r.baselineBewijs) {
      lines.push(`**Baseline (Stage A, no prior context):**`);
      lines.push(`> ${r.baselineBewijs.replace(/\n/g, "\n> ")}\n`);
    }
    if (r.experimentalBewijs) {
      lines.push(`**Experimental (with prior context injected):**`);
      lines.push(`> ${r.experimentalBewijs.replace(/\n/g, "\n> ")}\n`);
    }
  }

  const reportPath = join(reportDir, "report.md");
  writeFileSync(reportPath, `${lines.join("\n")}\n`);

  writeFileSync(
    join(reportDir, "prior-context.json"),
    `${JSON.stringify(priorContext, null, 2)}\n`,
  );

  console.log(`\nReport: ${reportPath}`);
  console.log(
    `Summary: golden ${summary.goldenAvgWc}w c${summary.goldenAvgConc} · baseline ${summary.baselineAvgWc}w c${summary.baselineAvgConc} · experimental ${summary.experimentalAvgWc}w c${summary.experimentalAvgConc}`,
  );
}

await withDatabase({ connectionString: PGURI }, async () => {
  await main();
});
