import { gateway } from "@ai-sdk/gateway";
import { Leercoach } from "@nawadi/core";
import { generateObject } from "ai";
import { after, NextResponse } from "next/server";
import { z } from "zod";
import { parseWerkprocesTitel } from "~/app/(dashboard)/(account)/profiel/[handle]/_lib/format-kerntaak";
import {
  filterWerkprocessenByScope,
  loadLeercoachRubric,
} from "~/app/(dashboard)/(account)/profiel/[handle]/leercoach/_lib/rubric";
import { SUMMARIZATION_MODEL } from "~/lib/ai-models";
import { getSession } from "~/lib/auth/server";
import { leercoachEnabled } from "~/lib/flags";
import { captureAiTurn, flushAiTelemetry } from "~/lib/posthog-ai";

// On-demand synthesis endpoint powering the "storyline overview" drawer.
//
// The drawer calls this once per open (POST with a list of werkprocesIds
// currently visible, usually the full in-scope list) and the server
// returns one short human-readable synthesis per werkproces, describing
// what has been said/drafted about it so far in this chat's history.
//
// Why one batched call instead of N per-werkproces calls:
//   - One LLM roundtrip caps latency at "single generation", not N×.
//   - The model benefits from seeing all werkprocessen at once — it can
//     disambiguate "we discussed this under werkproces X, not Y".
//   - Single request makes client-side UX trivial: one spinner, one
//     result, no per-row loading dance.
//
// Not persisted — this is derived state, cheap to regenerate, and
// kept out of the chat history so re-openings always reflect the
// latest conversation without stale-cache bugs.

export const maxDuration = 30;

// Model id centralized in ~/lib/ai-models as SUMMARIZATION_MODEL.

const bodySchema = z.object({
  werkprocesIds: z.array(z.string().uuid()).min(1).max(40),
});

const synthesisSchema = z.object({
  syntheses: z.array(
    z.object({
      werkprocesId: z.string(),
      /**
       * One-sentence Dutch synthesis (max ~140 chars). "Nog niet
       * besproken" when nothing relevant was said — the client
       * renders that state distinctly so empty state isn't noise.
       */
      summary: z.string(),
    }),
  ),
});

export async function POST(
  req: Request,
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

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }
  const user = session.user;

  const { id: chatId } = await ctx.params;
  const chat = await Leercoach.Chat.getById({ chatId, userId: user.id });
  if (!chat) {
    return NextResponse.json({ error: "Chat niet gevonden." }, { status: 404 });
  }
  // Q&A chats have no profiel to scope a rubric against — synthesis
  // is a portfolio-session-only feature. Return empty so the client
  // renders a no-op state instead of the caller having to branch.
  if (chat.profielId === null || chat.scope === null) {
    return NextResponse.json({ syntheses: [] });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ongeldige body." }, { status: 400 });
  }

  const [messages, rubric] = await Promise.all([
    Leercoach.Message.getByChatId({ chatId }),
    loadLeercoachRubric(chat.profielId),
  ]);
  if (!rubric) {
    return NextResponse.json(
      { error: "Kwalificatieprofiel kon niet worden geladen." },
      { status: 500 },
    );
  }

  const scoped = filterWerkprocessenByScope(rubric.werkprocessen, chat.scope);
  // Intersect requested ids with scoped set so the caller can't ask for
  // werkprocessen outside the chat's focus (keeps one prompt surface,
  // avoids leaking the full profiel rubric into an out-of-scope chat).
  const requested = new Set(parsed.data.werkprocesIds);
  const target = scoped.filter((wp) => requested.has(wp.id));
  if (target.length === 0) {
    return NextResponse.json({ syntheses: [] });
  }

  // Short-circuit: a brand-new chat with no real exchange has nothing
  // to synthesize. Return "nog niet besproken" placeholders and skip
  // the LLM call.
  const assistantOrUserCount = messages.filter(
    (m) => m.role === "user" || m.role === "assistant",
  ).length;
  if (assistantOrUserCount <= 1) {
    return NextResponse.json({
      syntheses: target.map((wp) => ({
        werkprocesId: wp.id,
        summary: "Nog niet besproken.",
      })),
    });
  }

  // Compact conversation transcript for the model. Keep only text
  // parts — tool calls and artefact chunks add bytes without changing
  // the semantic content the synthesizer needs to judge.
  const transcript = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => {
      const textChunks: string[] = [];
      for (const part of m.parts) {
        if (
          typeof part === "object" &&
          part !== null &&
          (part as { type?: unknown }).type === "text"
        ) {
          const maybeText = (part as { text?: unknown }).text;
          if (typeof maybeText === "string") textChunks.push(maybeText);
        }
      }
      const label = m.role === "user" ? "KANDIDAAT" : "LEERCOACH";
      return `${label}:\n${textChunks.join("\n")}`;
    })
    .join("\n\n---\n\n");

  const werkprocesBlock = target
    .map((wp) => {
      const parsed = parseWerkprocesTitel(wp.titel);
      const code = parsed.code ?? String(wp.rang);
      const label = parsed.label;
      return `- id=${wp.id} | code=${code} | titel=${label}`;
    })
    .join("\n");

  const system = `Je synthetiseert voortgang in een leercoach-sessie. Voor elk werkproces schrijf je één Nederlandse zin (max 140 tekens) die samenvat wat de kandidaat en coach er tot nu toe over hebben uitgewisseld — concreet, kort, en bewijs-gericht.

Regels:
- Als er niks substantieels over een werkproces is gezegd: schrijf exact "Nog niet besproken."
- Als er een Concept-paragraaf is geschreven: benoem dat ("Concept staat — over X en Y.").
- Als er alleen verkennende vragen of losse verhalen zijn: vat die kort samen ("Twee situaties genoemd: X en Y.").
- Géén meta-taal ("we hebben besproken dat…"). Direct to the point.
- Geen em-dashes (—); komma's of punten.
- Géén verzonnen details. Als iets niet in het transcript staat, zeg het niet.

Output: per werkprocesId één synthese. Retourneer de werkprocesId exact zoals in de lijst.`;

  const prompt = `WERKPROCESSEN:
${werkprocesBlock}

TRANSCRIPT:
${transcript}`;

  const turnStartedAt = Date.now();
  try {
    const { object, usage, providerMetadata } = await generateObject({
      model: gateway(SUMMARIZATION_MODEL),
      schema: synthesisSchema,
      system,
      prompt,
      temperature: 0.2,
    });

    const anthropic = providerMetadata?.anthropic as
      | {
          cacheCreationInputTokens?: number;
          cacheReadInputTokens?: number;
        }
      | undefined;
    captureAiTurn({
      userId: user.id,
      chatId: chat.chatId,
      callSite: "leercoach-synthesis",
      model: SUMMARIZATION_MODEL,
      status: "completed",
      durationMs: Date.now() - turnStartedAt,
      inputTokens: usage?.inputTokens ?? null,
      outputTokens: usage?.outputTokens ?? null,
      cacheReadTokens: anthropic?.cacheReadInputTokens ?? null,
      cacheCreateTokens: anthropic?.cacheCreationInputTokens ?? null,
      scopeType: chat.scope?.type ?? null,
    });
    after(flushAiTelemetry);

    // Backfill any werkproces the model skipped so the client can
    // render all rows deterministically.
    const returned = new Map(
      object.syntheses.map((s) => [s.werkprocesId, s.summary]),
    );
    const result = target.map((wp) => ({
      werkprocesId: wp.id,
      summary: returned.get(wp.id) ?? "Nog niet besproken.",
    }));
    return NextResponse.json({ syntheses: result });
  } catch (err) {
    console.error("synthesis generation failed", err);
    captureAiTurn({
      userId: user.id,
      chatId: chat.chatId,
      callSite: "leercoach-synthesis",
      model: SUMMARIZATION_MODEL,
      status: "errored",
      durationMs: Date.now() - turnStartedAt,
      scopeType: chat.scope?.type ?? null,
      errorCode: "generate_object_failed",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    after(flushAiTelemetry);
    return NextResponse.json(
      { error: "Synthese tijdelijk niet beschikbaar." },
      { status: 502 },
    );
  }
}
