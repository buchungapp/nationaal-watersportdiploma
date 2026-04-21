import { gateway } from "@ai-sdk/gateway";
import { Leercoach } from "@nawadi/core";
import { generateText } from "ai";
import { after, NextResponse } from "next/server";
import {
  approximateMessageTokens,
  approximateTotalTokens,
  findLatestDraftMessage,
  type MessageLike,
} from "~/app/(dashboard)/(account)/profiel/[handle]/leercoach/_lib/compaction";
import { SUMMARIZATION_MODEL } from "~/lib/ai-models";
import { leercoachEnabled } from "~/lib/flags";
import { captureAiTurn, flushAiTelemetry } from "~/lib/posthog-ai";
import { createClient } from "~/lib/supabase/server";

// Compaction endpoint — collapses older messages into a single
// Haiku-generated summary so long leercoach sessions stay under the
// 1M token context window.
//
// Triggered by:
//   - Manual "Gesprek comprimeren" from the ⋮ actions menu
//   - Auto-warn banner when tokens cross ~700k
//   - Error-banner CTA ("Comprimeer en probeer opnieuw") when the
//     model returns a context-limit error
//
// Pipeline:
//   1. Auth + chat ownership
//   2. Load full history, skip already-compacted rows
//   3. Split: cutoff = last KEEP_RECENT_TURNS turns stay verbatim,
//      everything earlier is the compaction range
//   4. In the compaction range, identify the latest-draft message
//      (longest-above-threshold rule) — it stays verbatim too
//   5. Haiku summarises everything else using the cookbook's
//      5-section Dutch prompt
//   6. Atomic write: insert summary row, mark compacted rows

export const maxDuration = 60;

// Model id centralized in ~/lib/ai-models as SUMMARIZATION_MODEL.
// Needs 1M-token context because long leercoach sessions routinely
// exceed Haiku's 200k ceiling (we measured 212k transcripts); staying
// on the same Sonnet build as CHAT_MODEL keeps the summary's phrasing
// quality close to the chat it summarises.

// How many recent turns stay verbatim alongside the summary. Tuned
// so the immediate coaching context survives (feedback → revision
// → feedback cycles) while still cutting deep into older noise.
const KEEP_RECENT_TURNS = 10;

// Minimum messages required before compaction is meaningful. Under
// this count, summarisation loses more context than it saves.
const MIN_MESSAGES_FOR_COMPACTION = 15;

const SUMMARY_SYSTEM_PROMPT = `Je krijgt de vroege geschiedenis van een leercoach-sessie. Vat deze samen zodat een nieuwe sessie-instance het werk kan voortzetten zonder de oorspronkelijke berichten te zien.

Structureer de samenvatting in vijf secties. Wrap het geheel in <summary></summary> tags.

1. **Taakoverzicht** — Kandidaat, profiel, niveau, scope van de sessie. Huidige fase (verkennen / ordenen / concept / verfijnen).

2. **Huidige staat per werkproces** — Welke werkprocessen zijn besproken? In welke diepte? Voor welke is een concept geschreven of geüpdatet? Geef werkproces-code, NIET de concept-tekst zelf (die wordt apart bewaard als 'laatste draft').

3. **Stem & stijl** — Welke schrijfstijl-keuzes de kandidaat maakt. Tone of voice, typische woorden / zinsritme. Voorbeelden uit eerder geüploade portfolio's die als stem-referentie dienen.

4. **Belangrijke ontdekkingen** — Praktijksituaties die genoemd zijn (thema's, geen PII / namen). Gaten die de coach heeft geflagd. Beslissingen over structuur of inhoud.

5. **Volgende stappen** — Wat willen we nu doen? Welke criteria missen nog bewijs?

BELANGRIJK:
- Schrijf geen concept-paragrafen uit. Die blijven verbatim bewaard.
- Geen em-dashes (—); gebruik komma's, punten of haakjes.
- Nederlands, compact, bewijs-gericht.`;

// Very rough user-side prompt framing for Haiku: a marker so it knows
// what it's reading + a reminder that some content is being filtered
// out (tool results, the preserved draft) for its own focus.
function buildSummaryUserPrompt(transcript: string): string {
  return `Hieronder staat de te comprimeren conversatie. Het meest recente bruikbare concept (indien aanwezig) is niet in dit transcript opgenomen — dat wordt apart verbatim bewaard naast jouw samenvatting. Volledige tool-resultaten (artefact-chunks, voorbeelden) zijn ook weggelaten; refereer er alleen op hoofdlijnen naar.

Schrijf de samenvatting.

<conversatie>
${transcript}
</conversatie>`;
}

function messageToTranscriptLine(m: MessageLike): string | null {
  // Text-only transcript — drop messages with no text content AND
  // any non-text parts from mixed messages. Tool results get the
  // biggest context savings here.
  const chunks: string[] = [];
  for (const part of m.parts) {
    if (
      typeof part === "object" &&
      part !== null &&
      (part as { type?: unknown }).type === "text"
    ) {
      const t = (part as { text?: unknown }).text;
      if (typeof t === "string" && t.trim().length > 0) chunks.push(t);
    }
  }
  if (chunks.length === 0) return null;
  const label =
    m.role === "user"
      ? "KANDIDAAT"
      : m.role === "assistant"
        ? "LEERCOACH"
        : m.role.toUpperCase();
  return `${label}:\n${chunks.join("\n")}`;
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await leercoachEnabled())) {
    return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    return NextResponse.json(
      { error: "AI_GATEWAY_API_KEY ontbreekt op de server." },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const { id: chatId } = await ctx.params;
  const chat = await Leercoach.Chat.getById({ chatId, userId: user.id });
  if (!chat) {
    return NextResponse.json({ error: "Chat niet gevonden." }, { status: 404 });
  }

  const all = await Leercoach.Message.getByChatId({ chatId });

  // Only rows that are still "active" context participate: we skip
  // anything already folded into a prior summary (its summary row is
  // present, which is what we'd re-compact together with newer
  // messages if we needed to stack compactions).
  const active = all.filter((m) => m.compactedIntoId === null);

  if (active.length < MIN_MESSAGES_FOR_COMPACTION) {
    return NextResponse.json(
      {
        error: "Te weinig berichten om te comprimeren.",
        messageCount: active.length,
      },
      { status: 400 },
    );
  }

  // Split: KEEP_RECENT_TURNS tail stays verbatim, the rest is up for
  // compaction. Need at least 1 message to compact after the split.
  const compactionRange: MessageLike[] = active.slice(
    0,
    Math.max(0, active.length - KEEP_RECENT_TURNS),
  );
  if (compactionRange.length === 0) {
    return NextResponse.json(
      { error: "Alles valt binnen de recente context; niets om te comprimeren." },
      { status: 400 },
    );
  }

  // Preserve the latest draft (longest-above-threshold most recent
  // assistant message) verbatim by excluding it from the compaction
  // range. The row stays a normal assistant message in the DB;
  // compaction simply leaves its compactedIntoId null so the main
  // send-path still picks it up.
  const preservedDraft = findLatestDraftMessage(compactionRange);
  const toCompact = preservedDraft
    ? compactionRange.filter((m) => m.messageId !== preservedDraft.messageId)
    : compactionRange;

  if (toCompact.length === 0) {
    return NextResponse.json(
      {
        error:
          "Alleen de laatste draft valt in de compacteerbare range — niets anders om samen te vatten.",
      },
      { status: 400 },
    );
  }

  const tokensSaved = approximateTotalTokens(toCompact);

  const transcript = toCompact
    .map(messageToTranscriptLine)
    .filter((line): line is string => line !== null)
    .join("\n\n---\n\n");

  if (transcript.trim().length === 0) {
    return NextResponse.json(
      {
        error:
          "Geen tekst gevonden om samen te vatten (alleen tool-resultaten in de range).",
      },
      { status: 400 },
    );
  }

  let summaryText: string;
  const turnStartedAt = Date.now();
  try {
    const result = await generateText({
      model: gateway(SUMMARIZATION_MODEL),
      system: SUMMARY_SYSTEM_PROMPT,
      prompt: buildSummaryUserPrompt(transcript),
      temperature: 0.2,
    });
    summaryText = result.text.trim();

    const anthropic = result.providerMetadata?.anthropic as
      | {
          cacheCreationInputTokens?: number;
          cacheReadInputTokens?: number;
        }
      | undefined;
    captureAiTurn({
      userId: user.id,
      chatId: chat.chatId,
      callSite: "leercoach-compaction",
      model: SUMMARIZATION_MODEL,
      status: "completed",
      durationMs: Date.now() - turnStartedAt,
      inputTokens: result.usage?.inputTokens ?? null,
      outputTokens: result.usage?.outputTokens ?? null,
      cacheReadTokens: anthropic?.cacheReadInputTokens ?? null,
      cacheCreateTokens: anthropic?.cacheCreationInputTokens ?? null,
      scopeType: chat.scope?.type ?? null,
    });
    after(flushAiTelemetry);
  } catch (err) {
    console.error("Compaction summary generation failed", err);
    // Try to surface something actionable. Token-limit errors from the
    // summarizer mean the conversation has outgrown even the 1M
    // context Sonnet supports — rare, but should tell the user
    // explicitly so they know a single-pass compaction can't rescue
    // this session. Other errors get a generic message.
    const rawMessage = err instanceof Error ? err.message : String(err);
    const hitLimit = /too long|maximum|context.*limit/i.test(rawMessage);
    captureAiTurn({
      userId: user.id,
      chatId: chat.chatId,
      callSite: "leercoach-compaction",
      model: SUMMARIZATION_MODEL,
      status: "errored",
      durationMs: Date.now() - turnStartedAt,
      scopeType: chat.scope?.type ?? null,
      errorCode: hitLimit ? "context_limit" : "generate_text_failed",
      errorMessage: rawMessage,
    });
    after(flushAiTelemetry);
    return NextResponse.json(
      {
        error: hitLimit
          ? "Dit gesprek is zelfs voor de samenvatter te lang geworden. Start een nieuwe sessie en upload dit portfolio als eerder werk."
          : "Samenvatting kon niet gemaakt worden. Probeer het zo nog eens.",
      },
      { status: 502 },
    );
  }

  if (!summaryText) {
    return NextResponse.json(
      { error: "Lege samenvatting ontvangen." },
      { status: 502 },
    );
  }

  // Ensure the <summary> wrapper is present. The prompt asks for it,
  // but Haiku occasionally drops it — adding it ourselves costs
  // nothing and keeps the next-turn context unambiguous for the
  // model that receives this as a user message.
  if (!summaryText.startsWith("<summary>")) {
    summaryText = `<summary>\n${summaryText}\n</summary>`;
  }

  const firstCompacted = toCompact[0];
  const lastCompacted = toCompact[toCompact.length - 1];
  if (!firstCompacted || !lastCompacted) {
    return NextResponse.json(
      { error: "Onverwacht: geen berichten in de compacteer-range." },
      { status: 500 },
    );
  }

  try {
    const { summaryMessageId } = await Leercoach.Message.saveCompaction({
      chatId,
      summaryText,
      compactedMessageIds: toCompact.map((m) => m.messageId),
      preservedDraftMessageId: preservedDraft?.messageId ?? null,
      fromCreatedAt: firstCompacted.createdAt,
      toCreatedAt: lastCompacted.createdAt,
      tokensSaved,
    });

    return NextResponse.json({
      summaryMessageId,
      compactedCount: toCompact.length,
      preservedDraft: preservedDraft
        ? {
            messageId: preservedDraft.messageId,
            approximateTokens: approximateMessageTokens(preservedDraft),
          }
        : null,
      tokensSaved,
    });
  } catch (err) {
    console.error("Compaction commit failed", err);
    return NextResponse.json(
      { error: "Samenvatting opslaan mislukt." },
      { status: 500 },
    );
  }
}
