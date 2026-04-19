import "server-only";
import { createHash } from "node:crypto";
import { gateway } from "@ai-sdk/gateway";
import { AiCorpus } from "@nawadi/core";
import { generateObject } from "ai";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { z } from "zod";

// Server-side pipeline for "kandidaat uploads a prior PvB portfolio".
// Steps:
//   1. Extract text from the uploaded PDF (pdfjs-dist, same lib the
//      offline corpus:extract script uses so behaviour matches).
//   2. Anonymize via regex + single LLM pass (mirrors the pattern in
//      scripts/corpus/anonymize.ts, tightened for a one-off upload).
//   3. Split anonymized text into paragraph-sized chunks.
//   4. Ingest into ai_corpus with consent_level="user_only" and
//      contributedByUserId=userId so only this user can retrieve it.
//
// All LLM calls go through AI Gateway. The pipeline is self-contained:
// it doesn't touch the offline CLI scripts (those stay as-is; duplicate
// code is small enough that sharing would add more coupling than it
// removes — revisit if either side grows).

// ---- 1. PDF extraction ----

export async function extractPdfText(
  bytes: Uint8Array,
): Promise<{ rawText: string; pageCount: number; charCount: number }> {
  const doc = await pdfjs.getDocument({ data: bytes }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    parts.push(pageText);
  }
  const rawText = parts.join("\n\n--- PAGE BREAK ---\n\n");
  return {
    rawText,
    pageCount: doc.numPages,
    charCount: rawText.length,
  };
}

// ---- 2. Anonymization ----

// Dutch date patterns + 4-digit years; same as the offline pipeline.
const DATE_PATTERNS: RegExp[] = [
  /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g,
  /\b(19[5-9]\d|20\d{2})\b/g,
  /\b(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+\d{4}\b/gi,
];

type RedactedEntities = {
  firstNames: string[];
  locations: string[];
  verenigingen: string[];
  datesYears: string[];
  other: string[];
};

function regexScrubDates(text: string, redacted: RedactedEntities): string {
  let scrubbed = text;
  for (const pattern of DATE_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, (match) => {
      redacted.datesYears.push(match);
      return "[DATUM]";
    });
  }
  redacted.datesYears = [...new Set(redacted.datesYears)];
  return scrubbed;
}

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
    .max(250),
});

const LLM_ANON_SYSTEM_PROMPT = `Je vindt persoonlijk identificeerbare informatie (PII) in een Nederlandstalig PvB-portfolio. Datums zijn al gescrubd; jouw taak is de overgebleven PII vinden (namen, verenigingen, locaties).

WAT PII IS:
- Voornamen, achternamen, initialen
- Namen van verenigingen, zeilscholen, watersportorganisaties, bedrijven
- Plaatsnamen, regio's, specifieke locaties

WAT GEEN PII IS:
- Algemene termen ("de cursisten", "een collega", "het team")
- Watersport-jargon ("rib", "trapezium", "vaargebied")
- Eerder al vervangen tokens zoals [KANDIDAAT], [DATUM] — overslaan
- Kwalificatienamen ("I4-portfolio", "niveau 3", "instructeur")

REGELS:
- Retourneer find-strings + category. "find" moet letterlijk in de tekst voorkomen.
- Maximaal 60 items per oproep.
- Exacte substring, case-sensitive.`;

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

function applyReplacements(
  text: string,
  replacements: Array<{ find: string; category: string }>,
  redacted: RedactedEntities,
): string {
  let out = text;
  // Longest-first so shorter strings don't eat into longer ones.
  const sorted = [...replacements].sort(
    (a, b) => b.find.length - a.find.length,
  );
  for (const r of sorted) {
    if (!out.includes(r.find)) continue;
    out = out.split(r.find).join(categoryToToken(r.category));
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
  redacted.other = [...new Set(redacted.other)];
  return out;
}

export async function anonymizeText(
  rawText: string,
): Promise<{ anonymizedText: string; redactedEntities: RedactedEntities }> {
  const redacted: RedactedEntities = {
    firstNames: [],
    locations: [],
    verenigingen: [],
    datesYears: [],
    other: [],
  };

  // Step 1: regex-scrub dates (deterministic, catches 95% of date PII).
  const dateScrubbed = regexScrubDates(rawText, redacted);

  // Step 2: single LLM pass for names / locations / verenigingen.
  const { object } = await generateObject({
    model: gateway("anthropic/claude-sonnet-4-5"),
    schema: LlmAnonymizationSchema,
    system: LLM_ANON_SYSTEM_PROMPT,
    prompt: `Scan deze tekst op PII die nog niet vervangen is:\n\n---\n${dateScrubbed}\n---`,
    temperature: 0,
  });

  const anonymizedText = applyReplacements(
    dateScrubbed,
    object.replacements,
    redacted,
  );

  return { anonymizedText, redactedEntities: redacted };
}

// ---- 3. Chunk split ----

/**
 * Split anonymized prior-portfolio text into paragraph-sized chunks
 * suitable for retrieval. 60-500 words keeps chunks long enough to be
 * useful as context but short enough that multiple can fit in a prompt.
 * No criterium mapping — we don't know the kandidaat's old rubric at
 * this point.
 */
export function splitIntoChunks(
  text: string,
): Array<{ content: string; wordCount: number }> {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({
      content: p,
      wordCount: p.split(/\s+/).filter(Boolean).length,
    }))
    .filter((c) => c.wordCount >= 60 && c.wordCount <= 500);
}

// ---- 4. Full pipeline ----

export type IngestPriorPortfolioResult = {
  sourceId: string;
  chunkCount: number;
  alreadyIngested: boolean;
  pageCount: number;
  charCount: number;
  redactedEntities: RedactedEntities;
};

/**
 * End-to-end: PDF bytes → extracted text → anonymized text → chunks →
 * ai_corpus row. Idempotent via source_hash: re-uploading the same PDF
 * returns the existing sourceId without touching anything.
 */
export async function ingestPriorPortfolio(input: {
  userId: string;
  pdfBytes: Uint8Array;
  niveauHint: number | null;
  label: string;
}): Promise<IngestPriorPortfolioResult> {
  const extracted = await extractPdfText(input.pdfBytes);
  const { anonymizedText, redactedEntities } = await anonymizeText(
    extracted.rawText,
  );
  const chunks = splitIntoChunks(anonymizedText);

  const sourceHash = createHash("sha256")
    .update(anonymizedText)
    .digest("hex");

  const sourceIdentifier = `user:${input.userId}:${sourceHash.slice(0, 12)}`;

  const result = await AiCorpus.upsertSourceWithChunks({
    source: {
      domain: "pvb_portfolio",
      sourceIdentifier,
      sourceHash,
      content: anonymizedText,
      consentLevel: "user_only",
      contributedByUserId: input.userId,
      profielId: null,
      niveauRang: input.niveauHint,
      metadata: {
        label: input.label,
        uploadedAt: new Date().toISOString(),
        redactedEntities,
      },
      charCount: anonymizedText.length,
      pageCount: extracted.pageCount,
    },
    chunks: chunks.map((c) => ({
      content: c.content,
      wordCount: c.wordCount,
      qualityScore: null,
      criteriumId: null,
      werkprocesId: null,
      metadata: {},
    })),
  });

  return {
    sourceId: result.sourceId,
    chunkCount: result.chunkCount,
    alreadyIngested: !result.inserted,
    pageCount: extracted.pageCount,
    charCount: anonymizedText.length,
    redactedEntities,
  };
}
