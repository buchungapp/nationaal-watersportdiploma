// Experiment v2: prior-portfolio few-shot with RAW paragraphs.
//
// V1 (experiment-prior-context.ts) extracted a structured profile from Maurits
// Misana's N3 + 4.1 and injected it as a system-prompt fragment. Result: length
// drifted further from golden; concreteness moved within noise. Negative.
//
// V2 hypothesis: structured extraction destroys the signal. The model doesn't
// need a summary of how Maurits writes — it needs to see HIM writing. Pull
// the three most-relevant paragraphs from his prior portfolios (scored by
// criterium keyword overlap) and inject them as few-shot examples at the top
// of each per-werkproces draft prompt.
//
// Reuses:
//   - Golden cache for 5.1_maurits (built in Stage E)
//   - runDraftGeneration from generator.ts
//   - systemPromptExtra hook that already threads through buildDraftPrompt
//
// Strategy:
//   - For each 5.1 werkproces, pick 3 best-matching prior paragraphs.
//   - Call runDraftGeneration once per werkproces with a scoped tree + the
//     per-werkproces few-shot as systemPromptExtra.
//   - Run a baseline alongside (no systemPromptExtra) for clean A/B.
//   - Report side-by-side + metrics.
//
// Run:
//   pnpm -C apps/web corpus:experiment:prior-context-v2

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { withDatabase } from "@nawadi/core";
import pg from "pg";
import { Agent, setGlobalDispatcher } from "undici";
import { runDraftGeneration } from "./portfolio-generator/generator.ts";
import type { Question } from "./portfolio-generator/schemas.ts";
import type {
  RubricTree,
  RubricWerkproces,
} from "./portfolio-generator/types.ts";
import {
  concretenessPer100,
  loadRubricByProfielTitel,
  wordCount,
} from "./eval-runner.ts";
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

// ---- 1. Prior-portfolio paragraph corpus ----

type PriorParagraph = {
  source: string;
  niveau: number;
  paragraphIndex: number;
  text: string;
  wordCount: number;
};

async function loadPriorText(sourceIdentifier: string): Promise<{
  content: string;
  niveau: number;
}> {
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
    if (!row) throw new Error(`No source ${sourceIdentifier} in ai_corpus.`);
    return { content: row.content, niveau: row.niveauRang };
  } finally {
    await client.end();
  }
}

function loadFromAnonymizedFile(filename: string, niveau: number): {
  content: string;
  niveau: number;
} {
  const path = join(ANONYMIZED_DIR, filename);
  const parsed = JSON.parse(readFileSync(path, "utf8")) as AnonymizedPortfolio;
  return { content: parsed.anonymizedText, niveau };
}

function splitParagraphs(
  text: string,
  source: string,
  niveau: number,
): PriorParagraph[] {
  return text
    .split(/\n{2,}/)
    .map((raw, i) => {
      const trimmed = raw.trim();
      const wc = trimmed.split(/\s+/).filter(Boolean).length;
      return { source, niveau, paragraphIndex: i, text: trimmed, wordCount: wc };
    })
    .filter((p) => p.wordCount >= 60 && p.wordCount <= 500);
}

// ---- 2. Keyword matcher (criterium → paragraph) ----

// Minimal Dutch stopword set. Tuned for bewijs-paragraph matching: we want
// content words (domain terms like "cursist", "training", "begeleidt") to
// dominate the score.
const DUTCH_STOPWORDS = new Set([
  "aan", "als", "dat", "deze", "die", "dit", "door", "een", "en", "er",
  "geen", "had", "hebben", "heeft", "het", "hier", "hij", "hun", "iets",
  "ik", "in", "is", "je", "kan", "kon", "laten", "mag", "me", "meer",
  "men", "met", "mijn", "moet", "naar", "niet", "nog", "nu", "of", "om",
  "ons", "onze", "op", "ook", "over", "per", "te", "toch", "toen", "uit",
  "van", "veel", "voor", "waar", "was", "wat", "we", "weer", "wel",
  "werd", "wij", "worden", "wordt", "ze", "zich", "zo", "zou", "zowel",
  "zich", "zijn", "zo", "zoals", "zodat", "er", "die", "dat", "bij",
  "maar", "als", "of", "dus", "dan", "al", "alle", "elke", "elk",
  "onze", "hun", "jouw", "jullie", "hen", "hem", "haar", "hij", "zij",
  "kun", "kan", "moet", "mogen", "willen", "gaan", "doen", "doet",
  "gedaan", "gaat", "ging", "word", "wordt", "werden", "geworden",
  "heb", "hebt", "heeft", "had", "hadden", "gehad", "ben", "bent",
  "bent", "was", "waren", "geweest", "zou", "zouden", "kan", "kon",
  "konden", "gekund", "iemand", "iets", "niets", "weinig", "alles",
  "ander", "andere", "anders", "zelf", "zelfde", "dezelfde",
  "tijdens", "vooral", "daarbij", "daarmee", "hierbij", "hiermee",
  "waarbij", "waarmee", "waarvoor", "waaruit", "waarin", "waarop",
  "daarover", "hierover", "over", "tot", "tussen", "vanuit",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics for matching
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function extractKeywords(...texts: string[]): Set<string> {
  const tokens = texts.flatMap(tokenize);
  return new Set(
    tokens.filter((t) => t.length >= 4 && !DUTCH_STOPWORDS.has(t)),
  );
}

function scoreParagraph(para: PriorParagraph, keywords: Set<string>): number {
  const paraTokens = new Set(tokenize(para.text));
  let hits = 0;
  for (const kw of keywords) {
    if (paraTokens.has(kw)) hits++;
  }
  return hits;
}

function pickTop3(
  paragraphs: PriorParagraph[],
  keywords: Set<string>,
  alreadyPicked: Set<string>,
): PriorParagraph[] {
  const scored = paragraphs
    .map((p) => ({ p, score: scoreParagraph(p, keywords) }))
    .filter(({ p }) => !alreadyPicked.has(`${p.source}#${p.paragraphIndex}`))
    .sort((a, b) => b.score - a.score);
  // Prefer diversity across source+niveau when scores are close.
  const picks: PriorParagraph[] = [];
  const seenSources = new Map<string, number>();
  for (const { p, score } of scored) {
    if (score === 0) break;
    const count = seenSources.get(p.source) ?? 0;
    if (count >= 2 && picks.length < scored.length) continue;
    picks.push(p);
    seenSources.set(p.source, count + 1);
    if (picks.length === 3) break;
  }
  // If we couldn't fill 3 with positive scores, just take best remaining.
  if (picks.length < 3) {
    for (const { p } of scored) {
      if (picks.find((x) => x.source === p.source && x.paragraphIndex === p.paragraphIndex)) continue;
      picks.push(p);
      if (picks.length === 3) break;
    }
  }
  return picks;
}

// ---- 3. Few-shot fragment for a werkproces ----

function buildPriorFewShotFragment(
  werkproces: RubricWerkproces,
  paragraphs: PriorParagraph[],
): string {
  if (paragraphs.length === 0) return "";
  const blocks = paragraphs
    .map(
      (p, i) =>
        `--- JOUW EERDERE VOORBEELD ${i + 1} (bron: ${p.source} niv ${p.niveau}, ${p.wordCount} woorden) ---\n${p.text}\n--- EINDE JOUW VOORBEELD ${i + 1} ---`,
    )
    .join("\n\n");

  return `# JOUW EIGEN STEM — paragrafen uit je eerdere PvB-portfolio's

Hieronder drie paragrafen die JIJ zelf eerder hebt geschreven (op niveau 3 en/of 4). Deze zijn gekozen omdat ze qua onderwerp dicht bij het huidige werkproces "${werkproces.titel}" liggen.

Gebruik ze als STEM-ANKER:
- Neem je eigen register en ritme over (hoe jij zinnen bouwt, welke formuleringen terugkomen).
- Neem je eigen signature phrases over als ze passen ("Een volgende keer", "Reflecterend op", enz.).
- Neem je eigen manier van reflecteren op ("probleem → analyse → oplossing → reflectie"-patronen).

NIET overnemen: de specifieke situaties zelf (die horen bij een ander werkproces op een ander niveau). Jouw huidige bewijs gaat over de antwoorden die de kandidaat net heeft gegeven, in JOUW stem.

${blocks}`;
}

// ---- 4. Experiment main ----

async function main() {
  console.log("Experiment v2: prior-portfolio RAW paragraphs as few-shot\n");

  // Load Maurits Misana's prior portfolios.
  const priorSources = [
    { content: (await loadPriorText("seed:alle_niveau_3_maurits")).content, source: "maurits_n3", niveau: 3 },
    { content: loadFromAnonymizedFile("4.1_maurits.json", 4).content, source: "maurits_4.1", niveau: 4 },
  ];

  const allParagraphs = priorSources.flatMap((s) =>
    splitParagraphs(s.content, s.source, s.niveau),
  );
  console.log(
    `Loaded ${priorSources.length} prior portfolios, split into ${allParagraphs.length} paragraphs (60–500 words).`,
  );
  for (const src of priorSources) {
    const count = allParagraphs.filter((p) => p.source === src.source).length;
    console.log(`  ${src.source} (niveau ${src.niveau}): ${count} paragraphs`);
  }

  // Load the Maurits 5.1 golden cache (same as v1).
  const goldenPath = join(GOLDEN_DIR, `5.1_maurits__Instructeur_5.json`);
  if (!existsSync(goldenPath)) {
    throw new Error(
      `No golden cache for 5.1_maurits at ${goldenPath}. Run the matrix first.`,
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
  console.log(`Loaded ${golden.pairs.length} golden pairs for 5.1_maurits.`);

  // Load the Instructeur 5 rubric.
  const rubric = await loadRubricByProfielTitel("Instructeur 5");
  if (rubric.status !== "found") {
    throw new Error("Instructeur 5 rubric missing or empty.");
  }
  const tree = rubric.tree;

  // Build questions + answers from the golden.
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

  // For each werkproces that has at least one golden pair, pick 3 best prior
  // paragraphs and build the few-shot fragment.
  const werkprocessenWithAnswers = tree.werkprocessen.filter((wp) =>
    golden.pairs.some((p) => p.werkprocesId === wp.id),
  );

  const picksPerWerkproces = new Map<string, PriorParagraph[]>();
  const alreadyPicked = new Set<string>();
  for (const wp of werkprocessenWithAnswers) {
    const keywords = extractKeywords(
      wp.titel,
      wp.resultaat ?? "",
      ...wp.criteria.map((c) => c.title),
      ...wp.criteria.map((c) => c.omschrijving),
    );
    const picks = pickTop3(allParagraphs, keywords, alreadyPicked);
    picksPerWerkproces.set(wp.id, picks);
    for (const p of picks) {
      alreadyPicked.add(`${p.source}#${p.paragraphIndex}`);
    }
    console.log(
      `  [${wp.titel}] picked ${picks.length} paragraphs  (top hits: ${picks.map((p) => `${p.source}#${p.paragraphIndex} ${scoreParagraph(p, keywords)}`).join(", ")})`,
    );
  }

  // Helper: run draft generation for one werkproces with optional extra.
  type RunResult = {
    werkprocesId: string;
    werkprocesTitel: string;
    drafts: Array<{ criteriumId: string; criteriumTitel: string; bewijs: string }>;
  };

  async function runPerWerkproces(
    wp: RubricWerkproces,
    systemPromptExtra: string | undefined,
  ): Promise<RunResult> {
    const scopedTree: RubricTree = { ...tree, werkprocessen: [wp] };
    const result = await runDraftGeneration({
      tree: scopedTree,
      questions,
      answers,
      systemPromptExtra,
    });
    const draft = result.drafts[0];
    if (!draft) {
      return {
        werkprocesId: wp.id,
        werkprocesTitel: wp.titel,
        drafts: [],
      };
    }
    return {
      werkprocesId: draft.werkprocesId,
      werkprocesTitel: draft.werkprocesTitel,
      drafts: draft.criteria.map((c) => ({
        criteriumId: c.criteriumId,
        criteriumTitel: c.criteriumTitel,
        bewijs: c.bewijs,
      })),
    };
  }

  console.log(`\nGenerating baseline (no prior context) — ${werkprocessenWithAnswers.length} werkprocessen in parallel...`);
  const baselineStart = Date.now();
  const baselineResults = await Promise.all(
    werkprocessenWithAnswers.map((wp) => runPerWerkproces(wp, undefined)),
  );
  console.log(`  done in ${((Date.now() - baselineStart) / 1000).toFixed(1)}s`);

  console.log(`\nGenerating experimental v2 (raw-paragraph few-shot per werkproces)...`);
  const expStart = Date.now();
  const experimentalResults = await Promise.all(
    werkprocessenWithAnswers.map((wp) => {
      const picks = picksPerWerkproces.get(wp.id) ?? [];
      const fragment = buildPriorFewShotFragment(wp, picks);
      return runPerWerkproces(wp, fragment || undefined);
    }),
  );
  console.log(`  done in ${((Date.now() - expStart) / 1000).toFixed(1)}s`);

  // Flatten + index for side-by-side.
  const baselineByCrit = new Map(
    baselineResults.flatMap((r) => r.drafts.map((d) => [d.criteriumId, d] as const)),
  );
  const expByCrit = new Map(
    experimentalResults.flatMap((r) => r.drafts.map((d) => [d.criteriumId, d] as const)),
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
    return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
  };

  const summary = {
    goldenAvgWc: avg(rows.map((r) => r.goldenWc)),
    goldenAvgConc: avg(rows.map((r) => r.goldenConc)),
    baselineAvgWc: avg(rows.map((r) => r.baselineWc)),
    baselineAvgConc: avg(rows.map((r) => r.baselineConc)),
    experimentalAvgWc: avg(rows.map((r) => r.experimentalWc)),
    experimentalAvgConc: avg(rows.map((r) => r.experimentalConc)),
  };

  // Write markdown report.
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const reportDir = join(
    REPORTS_DIR,
    `experiment-prior-context-v2-${timestamp}`,
  );
  mkdirSync(reportDir, { recursive: true });

  const lines: string[] = [];
  lines.push(`# Experiment v2: prior-portfolio RAW paragraphs as few-shot (Maurits N3+N4.1 → N5.1)\n`);
  lines.push(
    `Generated: ${new Date().toISOString()}  ·  golden cached, same rawAnswers for both runs\n`,
  );

  lines.push(`## Paragraph picks per werkproces\n`);
  for (const wp of werkprocessenWithAnswers) {
    const picks = picksPerWerkproces.get(wp.id) ?? [];
    lines.push(`### ${wp.titel}`);
    for (const p of picks) {
      lines.push(
        `- \`${p.source}#${p.paragraphIndex}\` (niv ${p.niveau}, ${p.wordCount}w)`,
      );
    }
    lines.push(``);
  }

  lines.push(`## Metrics summary\n`);
  lines.push(`| Variant | Avg words | Avg concreteness |`);
  lines.push(`|---|---|---|`);
  lines.push(`| Golden (real bewijs) | ${summary.goldenAvgWc} | ${summary.goldenAvgConc} |`);
  lines.push(`| Baseline (no prior context) | ${summary.baselineAvgWc} | ${summary.baselineAvgConc} |`);
  lines.push(
    `| **Experimental v2 (raw-paragraph few-shot)** | **${summary.experimentalAvgWc}** | **${summary.experimentalAvgConc}** |`,
  );
  lines.push(``);

  // For cross-reference, dump v1 numbers from today's run so a reader sees the full picture.
  lines.push(`For reference (v1, structured profile — today's earlier run):`);
  lines.push(`- golden 135.3w c1.3`);
  lines.push(`- baseline 177.9w c0.7`);
  lines.push(`- experimental v1 208.5w c0.8`);
  lines.push(``);

  lines.push(`## Per-criterium side-by-side\n`);
  for (const r of rows) {
    lines.push(`### ${r.werkprocesTitel} · ${r.criteriumTitel}\n`);
    lines.push(
      `golden ${r.goldenWc}w c${r.goldenConc}  ·  baseline ${r.baselineWc ?? "—"}w c${r.baselineConc ?? "—"}  ·  experimental-v2 ${r.experimentalWc ?? "—"}w c${r.experimentalConc ?? "—"}\n`,
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
      lines.push(`**Experimental v2 (raw-paragraph few-shot):**`);
      lines.push(`> ${r.experimentalBewijs.replace(/\n/g, "\n> ")}\n`);
    }
  }

  const reportPath = join(reportDir, "report.md");
  writeFileSync(reportPath, `${lines.join("\n")}\n`);

  // Also dump the per-werkproces picks for reproducibility.
  const pickDump = Array.from(picksPerWerkproces.entries()).map(
    ([werkprocesId, picks]) => ({
      werkprocesId,
      werkprocesTitel:
        tree.werkprocessen.find((w) => w.id === werkprocesId)?.titel ?? "",
      picks: picks.map((p) => ({
        source: p.source,
        niveau: p.niveau,
        paragraphIndex: p.paragraphIndex,
        wordCount: p.wordCount,
        text: p.text,
      })),
    }),
  );
  writeFileSync(
    join(reportDir, "picks.json"),
    `${JSON.stringify(pickDump, null, 2)}\n`,
  );

  console.log(`\nReport: ${reportPath}`);
  console.log(
    `Summary: golden ${summary.goldenAvgWc}w c${summary.goldenAvgConc} · baseline ${summary.baselineAvgWc}w c${summary.baselineAvgConc} · experimental-v2 ${summary.experimentalAvgWc}w c${summary.experimentalAvgConc}`,
  );
  console.log(
    `\nCompare to v1 (same-day, structured profile): baseline 177.9w c0.7 · experimental-v1 208.5w c0.8`,
  );
}

await withDatabase({ connectionString: PGURI }, async () => {
  await main();
});
