import "server-only";
import { createHash } from "node:crypto";
import { gateway } from "@ai-sdk/gateway";
import { AiCorpus } from "@nawadi/core";
import { generateObject } from "ai";
import { z } from "zod";
import { extractPdfText, splitIntoChunks } from "../../_lib/extract";

// Server-side pipeline for "kandidaat uploads a prior PvB portfolio".
// Steps:
//   1. Extract text from the uploaded PDF (shared _lib/extract.ts —
//      same helpers drive the artefact pipeline and the offline
//      corpus:extract script, so behaviour matches).
//   2. Anonymize via regex + single LLM pass (mirrors the pattern in
//      scripts/corpus/anonymize.ts, tightened for a one-off upload).
//   3. Split anonymized text into paragraph-sized chunks.
//   4. Ingest into ai_corpus with consent_level="user_only" and
//      contributedByUserId=userId so only this user can retrieve it.
//
// All LLM calls go through AI Gateway.

// ---- 1. Anonymization ----

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

// ---- 2. Full pipeline ----

export type IngestPortfolioResult = {
  sourceId: string;
  chunkCount: number;
  alreadyIngested: boolean;
  pageCount: number;
  charCount: number;
  redactedEntities: RedactedEntities;
};

export type PortfolioRichting = "instructeur" | "leercoach" | "pvb_beoordelaar";

/**
 * Which slice of the kwalificatieprofiel this upload covers. A
 * kandidaat whose PDF only has bewijs for kerntaak 4.1 (and not 4.8)
 * can tag it so — retrieval still matches by profielId, but the
 * metadata lets the leercoach surface "this fragment is from a
 * kerntaak-1-only portfolio" when summarising.
 *
 * Shape matches ChatScope's kerntaken variant for UI symmetry but
 * intentionally drops the single-"kerntaak" variant: uploads collapse
 * to the plural form regardless of count.
 */
export type CoverageScope =
  | { type: "full_profiel" }
  | { type: "kerntaken"; kerntaakCodes: string[] };

/**
 * End-to-end: PDF bytes → extracted text → anonymized text → chunks →
 * ai_corpus row. Idempotent via source_hash: re-uploading the same PDF
 * returns the existing sourceId without touching anything.
 *
 * Scope inputs:
 *   - `profielId`: required in practice (the UI always supplies one).
 *     The pipeline accepts null for CLI/back-channel callers that
 *     genuinely can't classify, but retrieval won't match those.
 *   - `richting`, `niveauRang`: derived from the profiel by the caller;
 *     stamped on the source row for retrieval-filter ergonomics.
 *   - `coverage`: per-upload narrowing within the profiel (stored in
 *     metadata.coverage, not used by retrieval filters yet).
 */
export async function ingestPortfolio(input: {
  userId: string;
  pdfBytes: Uint8Array;
  profielId: string | null;
  richting: PortfolioRichting | null;
  niveauRang: number | null;
  coverage: CoverageScope;
  label: string;
}): Promise<IngestPortfolioResult> {
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
      profielId: input.profielId,
      richting: input.richting,
      niveauRang: input.niveauRang,
      chatId: null, // portfolios are not chat-scoped — only artefacten are
      metadata: {
        label: input.label,
        uploadedAt: new Date().toISOString(),
        coverage: input.coverage,
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
