import "server-only";

// Shared text-extraction primitives for every upload path (portfolios,
// artefacten). Each extractor takes raw bytes + a mime hint and returns
// `{ rawText, pageCount? }`. The *pipeline* layer decides what to do
// with the extracted text (anonymise it, chunk it, store it, …).
//
// PDF extraction uses `unpdf` — a purpose-built serverless-Node
// wrapper around pdfjs-dist. Why unpdf over pdfjs-dist directly:
//
//   - pdfjs-dist@5 references browser globals (DOMMatrix / ImageData /
//     Path2D) at module-load time. On Vercel's Node serverless it
//     either needs @napi-rs/canvas as a polyfill (adds ~30 MB linux
//     binary + fragile outputFileTracingIncludes hints) or crashes.
//   - unpdf ships pre-patched pdfjs builds with the DOM references
//     stubbed out, no native binaries, no tracing hints needed.
//   - Same extraction quality; strictly less ceremony.
//
// All extractors run server-side (see the `server-only` import).

import { gateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { VISION_MODEL } from "~/lib/ai-models";
import { captureAiTurn } from "~/lib/posthog-ai";

/** Strip characters Postgres rejects in `text` columns (U+0000) and
 *  other non-semantic C0 controls pdfjs occasionally passes through
 *  from malformed content streams. Keeps tab / newline / CR. */
// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional
const C0_STRIPPER = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;

export function stripControlChars(input: string): string {
  return input.replace(C0_STRIPPER, "");
}

// ---- PDF ----

export async function extractPdfText(
  bytes: Uint8Array,
): Promise<{ rawText: string; pageCount: number; charCount: number }> {
  // mergePages: false → returns text[] with one entry per page so we
  // can interleave our own "--- PAGE BREAK ---" separator (matches
  // the previous pdfjs-dist output shape exactly; downstream
  // chunking + anonymisation rely on the separator).
  const pdf = await getDocumentProxy(bytes);
  const { text, totalPages } = await extractText(pdf, { mergePages: false });
  const rawText = stripControlChars(text.join("\n\n--- PAGE BREAK ---\n\n"));
  return {
    rawText,
    pageCount: totalPages,
    charCount: rawText.length,
  };
}

// ---- DOCX ----

/**
 * Mammoth converts a DOCX to plain text. We take the `.value` output
 * (messages get dropped — they're style-loss warnings we can't act on).
 */
export async function extractDocxText(
  bytes: Uint8Array,
): Promise<{ rawText: string; charCount: number }> {
  const result = await mammoth.extractRawText({
    // mammoth wants a Node Buffer
    buffer: Buffer.from(bytes),
  });
  const rawText = stripControlChars(result.value ?? "");
  return { rawText, charCount: rawText.length };
}

// ---- Image (via vision model) ----

// Model id centralized in ~/lib/ai-models as VISION_MODEL.

const IMAGE_TRANSCRIPTION_PROMPT = `Je transcribeert een afbeelding naar platte tekst zodat een digitale leercoach er later naar kan zoeken.

Als het een chatscreenshot is (WhatsApp, iMessage, Signal, …):
- Behoud de volgorde van berichten van boven naar beneden.
- Zet per bericht: "[afzender · tijdstip] inhoud" (tijdstip leeglaten als niet zichtbaar).
- Emoji/afbeeldingen-in-berichten beschrijven tussen haakjes, bv. (👍) of (afbeelding van zeilboot).

Als het een e-mail/screenshot van een document is:
- Transcribeer de tekst zo getrouw mogelijk, in leesvolgorde.
- Geef kopregels/structuur terug via lege regels.

Als het een foto van een whiteboard / handgeschreven notitie is:
- Transcribeer de tekst.
- Als het diagram of schema bevat, beschrijf kort de structuur in prozavorm.

Geef ALLEEN de transcriptie terug, geen preamble zoals "Hier is de transcriptie:". Nederlands uitvoer.`;

/**
 * Run a WhatsApp screenshot / photo / email-image through Claude's
 * vision mode and get back Dutch plain-text. This is dramatically
 * higher-quality than Tesseract for conversational screenshots
 * (preserves sender/timestamp, handles emojis, understands layout).
 *
 * Costs one AI Gateway round-trip per image — acceptable at upload
 * time (user-initiated, infrequent) but would not scale for per-turn
 * use.
 */
export async function extractImageText(
  bytes: Uint8Array,
  mimeType: string,
  // Optional telemetry context — when the caller has an authenticated
  // user + chat in scope it can thread them through so the PostHog
  // event lands on the right distinct_id. Absent → attributed to
  // "system" sentinel (see posthog-ai helper).
  options: { userId?: string | null; chatId?: string | null } = {},
): Promise<{ rawText: string; charCount: number }> {
  const turnStartedAt = Date.now();
  try {
    const { text, usage } = await generateText({
      model: gateway(VISION_MODEL),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: IMAGE_TRANSCRIPTION_PROMPT },
            {
              type: "image",
              // ai-sdk accepts a Uint8Array directly + a mediaType hint.
              image: bytes,
              mediaType: mimeType,
            },
          ],
        },
      ],
      temperature: 0,
    });
    const rawText = stripControlChars(text);
    captureAiTurn({
      userId: options.userId ?? null,
      chatId: options.chatId ?? null,
      callSite: "profile-extract",
      model: VISION_MODEL,
      status: "completed",
      durationMs: Date.now() - turnStartedAt,
      inputTokens: usage?.inputTokens ?? null,
      outputTokens: usage?.outputTokens ?? null,
    });
    return { rawText, charCount: rawText.length };
  } catch (err) {
    captureAiTurn({
      userId: options.userId ?? null,
      chatId: options.chatId ?? null,
      callSite: "profile-extract",
      model: VISION_MODEL,
      status: "errored",
      durationMs: Date.now() - turnStartedAt,
      errorCode: "generate_text_failed",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

// ---- Chunk split ----

/**
 * Split plain text into paragraph-sized chunks for retrieval. Shared
 * between the portfolio and artefact pipelines because the heuristic
 * (60–500 word paragraphs delimited by blank lines) is the same for
 * both: big enough to carry meaning, small enough to fit several in a
 * prompt.
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

/**
 * Fallback chunker for short-but-long-lined inputs that the primary
 * paragraph-chunker rejects (e.g. a 200-word WhatsApp transcription
 * with no blank lines, or a 2-paragraph email). Groups words into
 * ~200-word blocks so a small artefact still produces at least ONE
 * retrievable chunk instead of dropping everything.
 *
 * Used by the artefact pipeline only — portfolios are always long
 * enough that the primary chunker succeeds.
 */
export function splitIntoChunksFallback(
  text: string,
  targetWordsPerChunk = 200,
): Array<{ content: string; wordCount: number }> {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const chunks: Array<{ content: string; wordCount: number }> = [];
  for (let i = 0; i < words.length; i += targetWordsPerChunk) {
    const slice = words.slice(i, i + targetWordsPerChunk);
    chunks.push({
      content: slice.join(" "),
      wordCount: slice.length,
    });
  }
  return chunks;
}
