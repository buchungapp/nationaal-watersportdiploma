// Length + structure stats over the anonymized corpus.
// Writes a Markdown report to .tmp/portfolio-corpus/reports/stats.md.
//
// Run from repo root:
//   node --experimental-strip-types apps/web/scripts/corpus/report.ts
// Or:  pnpm -C apps/web corpus:report

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ANONYMIZED_DIR,
  type AnonymizedPortfolio,
  REPORTS_DIR,
} from "./shared.ts";

mkdirSync(REPORTS_DIR, { recursive: true });

const files = readdirSync(ANONYMIZED_DIR).filter((f) => f.endsWith(".json"));
if (files.length === 0) {
  console.error("No anonymized files found. Run extract + anonymize first.");
  process.exit(1);
}

const portfolios = files.map(
  (f) =>
    JSON.parse(
      readFileSync(join(ANONYMIZED_DIR, f), "utf8"),
    ) as AnonymizedPortfolio,
);

const wordCount = (s: string): number =>
  s.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;

const niveauBuckets = new Map<string, AnonymizedPortfolio[]>();
for (const p of portfolios) {
  const key = p.parsed.isFullNiveau
    ? `niveau ${p.parsed.inferredNiveau} (full)`
    : p.parsed.inferredNiveau
      ? `niveau ${p.parsed.inferredNiveau} (partial)`
      : "unknown";
  const bucket = niveauBuckets.get(key) ?? [];
  bucket.push(p);
  niveauBuckets.set(key, bucket);
}

function stats(numbers: number[]): {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  mean: number;
} {
  if (numbers.length === 0)
    return { min: 0, p25: 0, median: 0, p75: 0, max: 0, mean: 0 };
  const sorted = [...numbers].sort((a, b) => a - b);
  const pick = (q: number): number => {
    const idx = Math.max(
      0,
      Math.min(sorted.length - 1, Math.floor(q * sorted.length)),
    );
    return sorted[idx] ?? 0;
  };
  const mean = sorted.reduce((s, n) => s + n, 0) / sorted.length;
  return {
    min: sorted[0] ?? 0,
    p25: pick(0.25),
    median: pick(0.5),
    p75: pick(0.75),
    max: sorted[sorted.length - 1] ?? 0,
    mean: Math.round(mean),
  };
}

// Heuristic bewijs-segment detection. Real portfolios often split content by
// blank lines or small section headers. For Stage 0 stats we look at
// paragraph-sized chunks (>= 40 words) as a proxy for "bewijs-like text".
function paragraphsOf(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => wordCount(p) >= 40);
}

const lines: string[] = [];
lines.push("# Portfolio corpus — Stage 0 stats\n");
lines.push(`Generated: ${new Date().toISOString()}\n`);
lines.push(`Total portfolios: **${portfolios.length}**\n`);

// Niveau breakdown
lines.push("## Breakdown by niveau\n");
lines.push("| Bucket | Count |");
lines.push("|---|---|");
const sortedBuckets = [...niveauBuckets.entries()].sort((a, b) =>
  a[0].localeCompare(b[0]),
);
for (const [key, items] of sortedBuckets) {
  lines.push(`| ${key} | ${items.length} |`);
}
lines.push("");

// Kandidaten coverage
lines.push("## Kandidaten coverage\n");
const kandidaatCount = new Map<string, number>();
for (const p of portfolios) {
  const n = p.parsed.kandidaatName;
  kandidaatCount.set(n, (kandidaatCount.get(n) ?? 0) + 1);
}
const sortedKandidaten = [...kandidaatCount.entries()].sort(
  (a, b) => b[1] - a[1],
);
lines.push("| Kandidaat | Portfolios |");
lines.push("|---|---|");
for (const [name, count] of sortedKandidaten) {
  lines.push(`| ${name} | ${count} |`);
}
lines.push("");

// Kerntaak coverage
lines.push("## Kerntaak coverage (non-full portfolios)\n");
const kerntaakCount = new Map<string, number>();
for (const p of portfolios) {
  if (p.parsed.isFullNiveau) continue;
  for (const c of p.parsed.kerntaakCodes) {
    kerntaakCount.set(c, (kerntaakCount.get(c) ?? 0) + 1);
  }
}
const sortedKerntaken = [...kerntaakCount.entries()].sort((a, b) =>
  a[0].localeCompare(b[0]),
);
lines.push("| Kerntaak | Portfolios touching it |");
lines.push("|---|---|");
for (const [k, count] of sortedKerntaken) {
  lines.push(`| ${k} | ${count} |`);
}
lines.push("");

// Length distribution (full anonymized text, per portfolio)
const portfolioWordCounts = portfolios.map((p) => wordCount(p.anonymizedText));
const portfolioStats = stats(portfolioWordCounts);
lines.push("## Portfolio length (words, total)\n");
lines.push("| min | p25 | median | p75 | max | mean |");
lines.push("|---|---|---|---|---|---|");
lines.push(
  `| ${portfolioStats.min} | ${portfolioStats.p25} | ${portfolioStats.median} | ${portfolioStats.p75} | ${portfolioStats.max} | ${portfolioStats.mean} |`,
);
lines.push("");

// Paragraph length distribution — approximates bewijs-sized chunks
const allParagraphs = portfolios.flatMap((p) => paragraphsOf(p.anonymizedText));
const paragraphWords = allParagraphs.map(wordCount);
const paragraphStats = stats(paragraphWords);
lines.push(
  `## Paragraph length (words, for paragraphs >= 40 words, n=${allParagraphs.length})\n`,
);
lines.push(
  "Proxy for bewijs-block size. Our draft generator currently asks for 120-180 words and enforces min(80).\n",
);
lines.push("| min | p25 | median | p75 | max | mean |");
lines.push("|---|---|---|---|---|---|");
lines.push(
  `| ${paragraphStats.min} | ${paragraphStats.p25} | ${paragraphStats.median} | ${paragraphStats.p75} | ${paragraphStats.max} | ${paragraphStats.mean} |`,
);
lines.push("");

// Redaction totals (quality signal for Stage 0)
lines.push("## Redaction totals\n");
const totals = portfolios.reduce(
  (acc, p) => ({
    firstNames: acc.firstNames + p.redactedEntities.firstNames.length,
    locations: acc.locations + p.redactedEntities.locations.length,
    verenigingen: acc.verenigingen + p.redactedEntities.verenigingen.length,
    datesYears: acc.datesYears + p.redactedEntities.datesYears.length,
    other: acc.other + p.redactedEntities.other.length,
  }),
  { firstNames: 0, locations: 0, verenigingen: 0, datesYears: 0, other: 0 },
);
lines.push(`- First names: ${totals.firstNames}`);
lines.push(`- Locations: ${totals.locations}`);
lines.push(`- Verenigingen: ${totals.verenigingen}`);
lines.push(`- Dates/years: ${totals.datesYears}`);
lines.push(`- Other: ${totals.other}`);
const method =
  portfolios[0]?.anonymizationMethod === "regex+llm"
    ? "regex + LLM"
    : "regex-only";
lines.push(`\nMethod: ${method}\n`);

// Per-portfolio summary
lines.push("## Per-portfolio detail\n");
lines.push(
  "| File | Niveau | Scope | Pages | Words | Paragraphs ≥40w | Redacted total |",
);
lines.push("|---|---|---|---|---|---|---|");
for (const p of portfolios) {
  const scope = p.parsed.isFullNiveau
    ? "full"
    : p.parsed.kerntaakCodes.join(",");
  const redactedTotal =
    p.redactedEntities.firstNames.length +
    p.redactedEntities.locations.length +
    p.redactedEntities.verenigingen.length +
    p.redactedEntities.datesYears.length +
    p.redactedEntities.other.length;
  lines.push(
    `| ${p.sourceFile} | ${p.parsed.inferredNiveau ?? "?"} | ${scope} | ${p.pageCount} | ${wordCount(p.anonymizedText)} | ${paragraphsOf(p.anonymizedText).length} | ${redactedTotal} |`,
  );
}

const out = lines.join("\n");
const outPath = join(REPORTS_DIR, "stats.md");
writeFileSync(outPath, `${out}\n`);
console.log(`Report written: ${outPath}`);
console.log("");
console.log(out);
