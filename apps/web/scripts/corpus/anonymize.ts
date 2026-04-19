// Anonymise every extracted portfolio.
//
// Pass 1: regex scrub using filename-derived first name + common date/year patterns.
// Pass 2 (optional, requires ANTHROPIC_API_KEY): one Claude call per portfolio
//   to catch names, locations, verenigingen, dates the regex missed.
//
// Output: one JSON per portfolio to .tmp/portfolio-corpus/anonymized/.
//
// Run from repo root:
//   node --experimental-strip-types apps/web/scripts/corpus/anonymize.ts
// Or:  pnpm -C apps/web corpus:anonymize

import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { gateway } from "@ai-sdk/gateway";
import { generateObject } from "ai";
import { z } from "zod";
import {
  ANONYMIZED_DIR,
  type AnonymizedPortfolio,
  EXTRACTED_DIR,
  type ExtractedPortfolio,
} from "./shared.ts";

mkdirSync(ANONYMIZED_DIR, { recursive: true });

// Gateway reads AI_GATEWAY_API_KEY from env. Fall back to a direct ANTHROPIC_API_KEY
// check so the script is forgiving during the transition.
const hasLlm = !!(process.env.AI_GATEWAY_API_KEY || process.env.ANTHROPIC_API_KEY);
if (!hasLlm) {
  console.warn(
    "No AI_GATEWAY_API_KEY (or ANTHROPIC_API_KEY) set — running regex-only pass. Set the key in apps/web/.env.local and re-run for thorough coverage.",
  );
}

// Optional seed list of first names for the regex pass. Sourced from
// the CORPUS_ANON_SEED_NAMES env var (comma-separated) so we never
// commit the set of real kandidaat names that the corpus covers to
// the repo. Empty by default — the LLM pass catches the long tail,
// and the filename-derived name covers the dominant case.
const KNOWN_DUTCH_NAMES = (process.env.CORPUS_ANON_SEED_NAMES ?? "")
  .split(",")
  .map((n) => n.trim())
  .filter((n) => n.length > 0);

// Heuristics: ISO / European dates, 4-digit years (1950–2099), simple month+year.
const DATE_PATTERNS: RegExp[] = [
  /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g,
  /\b(19[5-9]\d|20\d{2})\b/g,
  /\b(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+\d{4}\b/gi,
];

function regexScrub(
  text: string,
  filenameName: string,
): {
  scrubbed: string;
  redacted: AnonymizedPortfolio["redactedEntities"];
} {
  let scrubbed = text;
  const redacted: AnonymizedPortfolio["redactedEntities"] = {
    firstNames: [],
    locations: [],
    verenigingen: [],
    datesYears: [],
    other: [],
  };

  // Scrub first names. Capitalize filename-derived name, search both exact
  // capital and first-letter-uppercased forms. Also scrub the known-name list.
  const namesToScrub = new Set<string>();
  if (filenameName && filenameName !== "unknown") {
    namesToScrub.add(
      filenameName.charAt(0).toUpperCase() + filenameName.slice(1).toLowerCase(),
    );
  }
  for (const n of KNOWN_DUTCH_NAMES) namesToScrub.add(n);

  for (const name of namesToScrub) {
    // Word boundary around the name — Dutch can suffix with possessive -s.
    const re = new RegExp(`\\b${name}\\b('s)?`, "g");
    if (re.test(scrubbed)) {
      redacted.firstNames.push(name);
      scrubbed = scrubbed.replace(re, "[KANDIDAAT]");
    }
  }

  for (const pattern of DATE_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, (match) => {
      redacted.datesYears.push(match);
      return "[DATUM]";
    });
  }

  // Dedupe redacted arrays.
  redacted.firstNames = [...new Set(redacted.firstNames)];
  redacted.datesYears = [...new Set(redacted.datesYears)];

  return { scrubbed, redacted };
}

// LLM pass: given the regex-scrubbed text, find remaining PII. We ask for the
// smallest edit set (find + replace tokens) rather than a full rewrite, so the
// original wording is preserved.
const LlmAnonymizationSchema = z.object({
  replacements: z
    .array(
      z.object({
        find: z.string().min(1),
        category: z.enum([
          "first_name",
          "location",
          "vereniging",
          "date_year",
          "other_pii",
        ]),
      }),
    )
    // The two longest full-niveau portfolios (~30K words each) genuinely need
    // >60 replacements. Keeping this generous avoids failing open to regex-only.
    .max(250),
});

const LLM_SYSTEM_PROMPT = `Je vindt persoonlijk identificeerbare informatie (PII) in een Nederlandstalig PvB-portfolio. De tekst is al eerder gescrubd; jouw taak is de overgebleven PII vinden.

WAT PII IS:
- Voornamen, achternamen, initialen
- Namen van verenigingen, zeilscholen, watersportorganisaties, bedrijven
- Plaatsnamen, regio's, specifieke locaties
- Volledige datums (12 juni 2018) of specifieke jaartallen in een identificerende context

WAT GEEN PII IS:
- Algemene termen zoals "de cursisten", "een collega", "het team", "een vereniging"
- Generieke watersport-jargon: "rib", "trapezium", "vaargebied"
- Eerder al vervangen tokens zoals [KANDIDAAT] of [DATUM] — deze zitten al goed, overslaan
- Kwalificatienamen: "I4-portfolio", "niveau 3", "instructeur"

REGELS:
- Retourneer een lijst find-strings met category. "find" moet letterlijk in de tekst voorkomen.
- Maximaal 60 items.
- Exacte substring, case-sensitive. Geen regex, geen fuzzy match.
- Dubbele items niet nodig — noem elke unieke string één keer.`;

async function llmPass(regexScrubbed: string): Promise<
  Array<{
    find: string;
    category: "first_name" | "location" | "vereniging" | "date_year" | "other_pii";
  }>
> {
  const { object } = await generateObject({
    model: gateway("anthropic/claude-sonnet-4-5"),
    schema: LlmAnonymizationSchema,
    system: LLM_SYSTEM_PROMPT,
    prompt: `Scan deze tekst op PII die nog niet vervangen is. Retourneer alleen unieke find-strings.\n\n---\n${regexScrubbed}\n---`,
    temperature: 0,
  });
  return object.replacements;
}

function applyLlmReplacements(
  text: string,
  replacements: Array<{ find: string; category: string }>,
  redacted: AnonymizedPortfolio["redactedEntities"],
): string {
  let out = text;
  // Sort longest-first so shorter substrings don't eat into longer ones (e.g. "Jade" vs "Jadestraat").
  const sorted = [...replacements].sort((a, b) => b.find.length - a.find.length);
  for (const r of sorted) {
    if (!out.includes(r.find)) continue;
    const token = categoryToToken(r.category);
    // Literal-string replace by splitting + joining.
    out = out.split(r.find).join(token);
    switch (r.category) {
      case "first_name":
        redacted.firstNames.push(r.find);
        break;
      case "location":
        redacted.locations.push(r.find);
        break;
      case "vereniging":
        redacted.verenigingen.push(r.find);
        break;
      case "date_year":
        redacted.datesYears.push(r.find);
        break;
      default:
        redacted.other.push(r.find);
    }
  }
  redacted.firstNames = [...new Set(redacted.firstNames)];
  redacted.locations = [...new Set(redacted.locations)];
  redacted.verenigingen = [...new Set(redacted.verenigingen)];
  redacted.datesYears = [...new Set(redacted.datesYears)];
  redacted.other = [...new Set(redacted.other)];
  return out;
}

function categoryToToken(category: string): string {
  switch (category) {
    case "first_name":
      return "[KANDIDAAT]";
    case "location":
      return "[LOCATIE]";
    case "vereniging":
      return "[VERENIGING]";
    case "date_year":
      return "[DATUM]";
    default:
      return "[PII]";
  }
}

const extractedFiles = readdirSync(EXTRACTED_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();

console.log(
  `Anonymising ${extractedFiles.length} extracted portfolios (method: ${hasLlm ? "regex+llm" : "regex-only"})`,
);

for (const jsonFile of extractedFiles) {
  // Idempotent re-run: if an anonymized output already exists and it was
  // produced by the regex+llm pass, skip the file. Delete the output manually
  // to force a retry. This keeps gateway spend bounded on repeat invocations.
  const outPath = join(ANONYMIZED_DIR, jsonFile);
  try {
    const existing = JSON.parse(
      readFileSync(outPath, "utf8"),
    ) as AnonymizedPortfolio;
    if (existing.anonymizationMethod === "regex+llm") {
      console.log(`  ↷ ${jsonFile}  (already regex+llm, skipping)`);
      continue;
    }
  } catch {
    // Not yet written, or unreadable — fall through and anonymise.
  }

  const extracted = JSON.parse(
    readFileSync(join(EXTRACTED_DIR, jsonFile), "utf8"),
  ) as ExtractedPortfolio;

  const { scrubbed, redacted } = regexScrub(
    extracted.rawText,
    extracted.parsed.kandidaatName,
  );

  let finalText = scrubbed;

  if (hasLlm) {
    try {
      const replacements = await llmPass(scrubbed);
      finalText = applyLlmReplacements(scrubbed, replacements, redacted);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      console.error(
        `  ! ${jsonFile}: LLM pass failed (${reason}) — keeping regex-only output`,
      );
    }
  }

  // Build the output by explicit field selection — do NOT spread `extracted`
  // or rawText will leak into the anonymised file. This is the whole point.
  const output: AnonymizedPortfolio = {
    sourceFile: extracted.sourceFile,
    parsed: extracted.parsed,
    pageCount: extracted.pageCount,
    charCount: extracted.charCount,
    extractedAt: extracted.extractedAt,
    anonymizedAt: new Date().toISOString(),
    anonymizationMethod: hasLlm ? "regex+llm" : "regex-only",
    anonymizedText: finalText,
    redactedEntities: redacted,
  };

  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);

  console.log(
    `  ✓ ${jsonFile}  names:${redacted.firstNames.length} loc:${redacted.locations.length} ver:${redacted.verenigingen.length} dat:${redacted.datesYears.length} other:${redacted.other.length}`,
  );
}

console.log(
  `\nAnonymised ${extractedFiles.length} portfolios. Inspect .tmp/portfolio-corpus/anonymized/ before using.`,
);

// Cleanup: if every anonymized file passed the LLM pass, wipe the extracted/
// directory so the unredacted raw text doesn't sit on disk next to the clean
// outputs. Re-running corpus:extract rebuilds it in ~20 seconds.
const anonFiles = readdirSync(ANONYMIZED_DIR).filter((f) => f.endsWith(".json"));
const allCleanRegexPlusLlm = anonFiles.every((f) => {
  try {
    const parsed = JSON.parse(
      readFileSync(join(ANONYMIZED_DIR, f), "utf8"),
    ) as AnonymizedPortfolio;
    return parsed.anonymizationMethod === "regex+llm";
  } catch {
    return false;
  }
});

if (allCleanRegexPlusLlm && anonFiles.length === extractedFiles.length) {
  console.log(
    "\nAll anonymized files passed the LLM pass. Wiping extracted/ (contains raw unredacted PII).",
  );
  rmSync(EXTRACTED_DIR, { recursive: true, force: true });
  console.log("  ✓ extracted/ removed. Re-run corpus:extract to rebuild.");
} else {
  console.log(
    "\nKeeping extracted/ in place (some files still regex-only, or count mismatch). Fix and re-run.",
  );
}
