import "server-only";

// Server-side pipeline for "kandidaat uploads an artefact inside a
// leercoach chat". Distinct from portfolios in three ways:
//   1. Chat-scoped (source.chatId set, cascades on chat delete).
//   2. No anonymisation — artefacten are user_only forever and never
//      get promoted to the seed corpus; the user wants their own names
//      + context preserved.
//   3. Adds an LLM-generated summary at ingest time so the cheap
//      `listArtefacten` tool can return meaningful hints without
//      reading every chunk.
//
// Steps:
//   a. Extract raw text from the input (file or pasted string)
//   b. Generate a 1–3 sentence summary (one LLM call)
//   c. Chunk (paragraph-primary, word-count fallback for short inputs)
//   d. Upsert into ai_corpus.source with domain="artefact", chatId set
//
// The pipeline is idempotent via source_hash: re-uploading the same
// content returns the existing sourceId without touching anything.

import { createHash } from "node:crypto";
import { gateway } from "@ai-sdk/gateway";
import { AiCorpus } from "@nawadi/core";
import { generateText } from "ai";
import {
  extractDocxText,
  extractImageText,
  extractPdfText,
  splitIntoChunks,
  splitIntoChunksFallback,
  stripControlChars,
} from "../../_lib/extract";

export type ArtefactType = "pdf" | "docx" | "text" | "image";

export type ArtefactPipelineInput = {
  userId: string;
  chatId: string;
  /** Display label the user gave (or we auto-generated from filename / first line). */
  label: string;
} & (
  | { kind: "text"; content: string }
  | { kind: "pdf"; bytes: Uint8Array }
  | { kind: "docx"; bytes: Uint8Array }
  | { kind: "image"; bytes: Uint8Array; mimeType: string }
);

export type IngestArtefactResult = {
  artefactId: string;
  artefactType: ArtefactType;
  chunkCount: number;
  alreadyIngested: boolean;
  charCount: number;
  pageCount: number | null;
  summary: string;
};

// ---- Summary generation ----

const SUMMARY_MODEL = "anthropic/claude-sonnet-4-5";

const SUMMARY_PROMPT = `Je krijgt de tekst van een artefact dat een kandidaat heeft geüpload aan hun digitale leercoach (opleidingsplan, WhatsApp-transcript, e-mail, notitie, …).

Schrijf een samenvatting van 1 tot 3 zinnen in het Nederlands. Beschrijf KORT:
- Wat voor soort document het is.
- Waar het globaal over gaat.
- Welke concrete details opvallen (genoemde rollen, thema's, beslissingen) als die er zijn.

Geef ALLEEN de samenvatting terug, geen preamble zoals "Dit document gaat over:". Maximaal 60 woorden.`;

async function generateSummary(text: string): Promise<string> {
  // Truncate very long artefacten before summarising — the first ~8k
  // chars are usually enough to characterise the document, and we
  // don't want to blow the context window / bill for the whole thing.
  const truncated = text.slice(0, 8000);
  const { text: summary } = await generateText({
    model: gateway(SUMMARY_MODEL),
    system: SUMMARY_PROMPT,
    prompt: truncated,
    temperature: 0.2,
  });
  return stripControlChars(summary).trim();
}

// ---- Main pipeline ----

/**
 * End-to-end: input (file bytes or pasted string) → extracted text →
 * summary + chunks → ai_corpus row. Returns the artefactId the caller
 * can surface back to the UI as a chip.
 */
export async function ingestArtefact(
  input: ArtefactPipelineInput,
): Promise<IngestArtefactResult> {
  // --- 1. Extract raw text ---
  let rawText = "";
  let pageCount: number | null = null;
  let artefactType: ArtefactType;

  if (input.kind === "text") {
    rawText = stripControlChars(input.content);
    artefactType = "text";
  } else if (input.kind === "pdf") {
    const { rawText: extracted, pageCount: pages } = await extractPdfText(
      input.bytes,
    );
    rawText = extracted;
    pageCount = pages;
    artefactType = "pdf";
  } else if (input.kind === "docx") {
    const { rawText: extracted } = await extractDocxText(input.bytes);
    rawText = extracted;
    artefactType = "docx";
  } else {
    const { rawText: extracted } = await extractImageText(
      input.bytes,
      input.mimeType,
    );
    rawText = extracted;
    artefactType = "image";
  }

  if (rawText.trim().length === 0) {
    throw new Error(
      "Geen tekst kunnen lezen uit dit bestand — probeer een ander formaat of plak de inhoud als tekst.",
    );
  }

  // --- 2. Chunk (paragraph-primary, fallback for short single-para texts) ---
  let chunks = splitIntoChunks(rawText);
  if (chunks.length === 0) {
    chunks = splitIntoChunksFallback(rawText);
  }
  if (chunks.length === 0) {
    throw new Error("Tekst is te kort om op te slaan als artefact.");
  }

  // --- 3. Summary + hash (parallel — independent) ---
  const [summary, sourceHash] = await Promise.all([
    generateSummary(rawText),
    Promise.resolve(createHash("sha256").update(rawText).digest("hex")),
  ]);

  const sourceIdentifier = `chat:${input.chatId}:${sourceHash.slice(0, 12)}`;

  // --- 4. Persist ---
  const result = await AiCorpus.upsertSourceWithChunks({
    source: {
      domain: "artefact",
      sourceIdentifier,
      sourceHash,
      content: rawText,
      consentLevel: "user_only",
      contributedByUserId: input.userId,
      profielId: null,
      richting: null,
      niveauRang: null,
      chatId: input.chatId,
      metadata: {
        label: input.label,
        artefactType,
        summary,
        uploadedAt: new Date().toISOString(),
      },
      charCount: rawText.length,
      pageCount,
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
    artefactId: result.sourceId,
    artefactType,
    chunkCount: result.chunkCount,
    alreadyIngested: !result.inserted,
    charCount: rawText.length,
    pageCount,
    summary,
  };
}
