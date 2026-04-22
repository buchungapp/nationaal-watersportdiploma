import { gateway } from "@ai-sdk/gateway";
import { AiCorpus, Leercoach } from "@nawadi/core";
import {
  convertToModelMessages,
  generateId,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { Redis } from "ioredis";
import { after, NextResponse } from "next/server";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import throttle from "throttleit";
import { buildSystemPrompt } from "~/app/(dashboard)/(account)/profiel/[handle]/leercoach/_lib/system-prompt";
import {
  buildLeercoachTools,
  buildQATools,
} from "~/app/(dashboard)/(account)/profiel/[handle]/leercoach/_lib/tools";
import { CHAT_MODEL } from "~/lib/ai-models";
import { leercoachEnabled } from "~/lib/flags";
import { captureAiTurn, flushAiTelemetry } from "~/lib/posthog-ai";
import { createClient } from "~/lib/supabase/server";

// Chat API for /leercoach — streaming text completions via AI Gateway
// with tool-call support AND resumable streams over Upstash/ioredis.
//
// Resumability pipeline (mirrors the Vercel reference example):
//   1. Client POSTs `{ id, trigger, message?, messageId? }` (single
//      message + trigger, NOT the full history) — the DB is the source
//      of truth.
//   2. Route loads history, persists the new user turn synchronously,
//      clears any stale canceledAt so this turn isn't killed by a
//      prior cancel.
//   3. `streamText` runs with `abortSignal` wired to a local
//      AbortController; a throttled `onChunk` callback polls the chat
//      row for `canceledAt` (set by DELETE /stream) and aborts when
//      it appears — this is how Stop survives resume:true.
//   4. Inside `consumeSseStream`, the outgoing stream is forked into
//      a Redis-backed resumable sink keyed by a fresh streamId, and
//      the chat row is updated so GET /stream can reconnect to it.
//   5. `onFinish` persists every assistant message produced and nulls
//      `activeStreamId` — the stream terminates cleanly either way.
//
// Client disconnect ≠ stream abort: `after()` keeps the resumable
// context alive past HTTP response, so a user navigating away finds
// the assistant message fully persisted when they return. See the
// GET route in ./[id]/stream/route.ts for the reconnect path.

export const maxDuration = 60;

// Model id centralized in ~/lib/ai-models so a single swap flips the
// whole chat stack. See CHAT_MODEL for the role rationale.

// Body shape produced by the client's DefaultChatTransport. Discriminated
// on `trigger` — zod-like parsing inline instead of a zod schema so we
// keep the route dependency-lean.
type ChatRequestBody = {
  id: string;
  trigger: "submit-message" | "regenerate-message";
  message?: UIMessage;
  messageId?: string;
};

function parseBody(raw: unknown): ChatRequestBody | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string") return null;
  if (r.trigger !== "submit-message" && r.trigger !== "regenerate-message") {
    return null;
  }
  return {
    id: r.id,
    trigger: r.trigger,
    message: r.message as UIMessage | undefined,
    messageId: typeof r.messageId === "string" ? r.messageId : undefined,
  };
}

/**
 * Singleton Redis client per module instance. Reused across requests
 * in the same Node worker to avoid reconnect overhead on every POST.
 * `resumable-stream/ioredis` accepts a single client + its `.duplicate()`
 * for the subscriber side, matching Redis's one-connection-per-subscriber
 * rule.
 */
let _redis: Redis | null = null;
function getRedis(): Redis {
  if (_redis) return _redis;
  const url = process.env.REDIS_URL;
  if (!url || url.trim() === "") {
    throw new Error(
      "REDIS_URL is required for resumable streams — see docker-compose.yml or set the Upstash URL in production.",
    );
  }
  _redis = new Redis(url);
  return _redis;
}

export async function POST(req: Request) {
  // Feature flag gate — returns 404 when the leercoach feature is
  // disabled for this user. 404 (not 403) so disabled users can't
  // distinguish "you don't have access" from "this endpoint does
  // not exist"; matches how the matching pages behave via notFound().
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

  const body = parseBody(await req.json());
  if (!body) {
    return NextResponse.json(
      { error: "Ongeldige request body." },
      { status: 400 },
    );
  }

  const chat = await Leercoach.Chat.getById({
    chatId: body.id,
    userId: user.id,
  });
  if (!chat) {
    return NextResponse.json({ error: "Chat niet gevonden." }, { status: 404 });
  }

  // Two chat shapes flow through this route from here on:
  //   - Q&A-sessie (profielId + scope null): Q&A prompt, empty tool
  //     belt, no phase machinery.
  //   - Portfolio-sessie: full coaching prompt + rubric + tools.
  // Everything below branches on chat.profielId where the two
  // shapes diverge; shared infrastructure (message load, compaction
  // filter, stream plumbing) treats them identically.
  const isQA = chat.profielId === null || chat.scope === null;

  // Source of truth is the DB. On resume there's no history payload to
  // trust, so we always rebuild from persisted messages + apply the
  // current trigger's delta. This also means tool-step messages from
  // prior partial turns are included — exactly what the model needs
  // to continue coherently.
  const persisted = await Leercoach.Message.getByChatId({
    chatId: chat.chatId,
  });
  // Compaction filter: skip rows that have been folded into a summary.
  // They're still in the DB for UI display + audit, but the model
  // never sees them again — the summary row carries their gist. The
  // preserved-draft message (pointed to by summary metadata) stays
  // because its own compactedIntoId is null; it's unaffected here.
  const activeForModel = persisted.filter((m) => m.compactedIntoId === null);
  let messages: UIMessage[] = activeForModel.map(
    (m) =>
      ({
        id: m.messageId,
        role: m.role,
        parts: m.parts,
      }) as UIMessage,
  );

  if (body.trigger === "submit-message") {
    if (!body.message) {
      return NextResponse.json(
        { error: "message ontbreekt bij submit-message." },
        { status: 400 },
      );
    }
    // Optional messageId truncation: when the client sends a messageId
    // alongside a submit, it's editing at that position — drop
    // everything from there onward before appending.
    if (body.messageId) {
      const idx = messages.findIndex((m) => m.id === body.messageId);
      if (idx !== -1) messages = messages.slice(0, idx);
    }
    // Persist the user turn synchronously so a mid-stream refresh
    // still shows what they typed. The save mutation UPSERTs on the
    // id we pass — so a retried submit with the same id is a no-op
    // insert + redundant update, not a duplicate row.
    await Leercoach.Message.save({
      id: body.message.id,
      chatId: chat.chatId,
      role: "user",
      parts: body.message.parts as Array<{
        type: string;
        [k: string]: unknown;
      }>,
    });
    messages = [...messages, body.message];
  } else {
    // regenerate-message: truncate to the message just before the
    // target (or before the last assistant if no messageId). The
    // already-persisted target assistant message is NOT deleted from
    // the DB here — the new turn will save a fresh assistant message
    // with a new id, and the UI renders by the current message list.
    const idx = body.messageId
      ? messages.findIndex((m) => m.id === body.messageId)
      : messages.length - 1;
    if (idx === -1) {
      return NextResponse.json(
        { error: "Kon de te hergenereren boodschap niet vinden." },
        { status: 400 },
      );
    }
    const target = messages[idx];
    messages = messages.slice(0, target?.role === "assistant" ? idx : idx + 1);
  }

  // Clear any stale cancel signal from a prior turn so the freshly
  // started streamText isn't aborted on its first onChunk.
  await Leercoach.Chat.clearCanceled({ chatId: chat.chatId });

  // Counts feed the portfolio-sessie system prompt's tool-usage
  // nudges. For Q&A-sessies these are ignored by buildSystemPrompt,
  // but we still fetch them because AiCorpus.* is user-scoped and
  // cheap — the potential future use from a Q&A chat suggesting
  // "let's pull up your prior work" justifies the query either way.
  //   - priorPortfolioCount drives the "call searchPriorPortfolio" hint
  //   - chatArtefactCount drives the "don't spam listArtefacten" hint
  //     (observed up to 20× redundant calls per session pre-fix)
  // Draft snapshot for the system prompt: lets the coach route
  // "wat ik heb geschreven" / "mijn tekst" / "de draft" to readDraft
  // instead of searchPriorPortfolio (the two overlap for users who
  // both uploaded a prior PDF AND are writing in-session — without
  // this the model defaults to searchPriorPortfolio). Two extra
  // queries per turn, both indexed point-lookups; cheap relative to
  // the AI Gateway round-trip.
  const draftStatePromise = (async () => {
    if (!chat.portfolioId) return null;
    const portfolio = await Leercoach.Portfolio.getById({
      portfolioId: chat.portfolioId,
      userId: user.id,
    });
    if (!portfolio || !portfolio.currentVersionId) return null;
    const version = await Leercoach.Portfolio.getVersionById({
      versionId: portfolio.currentVersionId,
      userId: user.id,
    });
    if (!version) return null;
    return {
      charCount: version.content.length,
      lastEditedBy: version.createdBy,
    };
  })();

  const [priorSources, chatArtefacten, draftState] = await Promise.all([
    AiCorpus.listUserPriorSources({ userId: user.id }),
    AiCorpus.listArtefactsForChat({
      chatId: chat.chatId,
      userId: user.id,
    }),
    draftStatePromise,
  ]);
  const priorPortfolioCount = priorSources.length;
  const artefactCount = chatArtefacten.length;

  const [modelMessages, systemPrompt] = await Promise.all([
    convertToModelMessages(messages),
    buildSystemPrompt({
      profielId: chat.profielId,
      scope: chat.scope,
      priorPortfolioCount,
      artefactCount,
      phase: chat.phase,
      draftState,
    }),
  ]);

  // Tool belt branches on chat shape: Q&A-sessies get the empty
  // (soon-to-be KSS/KB/user-context) set; portfolio-sessies get the
  // full coaching tools. Narrowing via `isQA` lets us pass
  // non-null profielId/scope where required below.
  const tools = isQA
    ? buildQATools({ userId: user.id, chatId: chat.chatId })
    : buildLeercoachTools({
        // Non-null-asserted: isQA=false means profielId + scope are set.
        profielId: chat.profielId as string,
        scope: chat.scope as NonNullable<typeof chat.scope>,
        userId: user.id,
        chatId: chat.chatId,
        portfolioId: chat.portfolioId,
        // The AI SDK doesn't expose the id of the message currently
        // being streamed at the point where tools are built. Leave
        // as null — saveDraft can still commit the version; the
        // link-back from version → message is nice-to-have, not
        // critical. A follow-up can thread this through once we land
        // a wrapper around streamText that knows the id ahead of time.
        currentMessageId: null,
      });

  // Server-side abort controller. Wired into streamText's abortSignal
  // so the LLM call terminates cleanly when the user hits Stop. The
  // signal is fired by our throttled onChunk once it spots canceledAt.
  const userStopSignal = new AbortController();

  // PostHog telemetry: wall-clock start for duration_ms. onFinish fires
  // for both successful and aborted streams (finishReason differs), so
  // a single capture there covers completed + cancelled + errored.
  const turnStartedAt = Date.now();

  // Prompt caching: send the system prompt as TWO ordered system
  // messages. The first carries persona + rubric + scope intro (byte-
  // stable across turns in the same chat) and is marked with
  // Anthropic's cacheControl breakpoint. The second carries phase +
  // counts + phase reminder (dynamic per turn) and is sent uncached.
  //
  // Why two system messages instead of one with parts: the AI SDK
  // typing allows `system: SystemModelMessage[]`, and each SystemModel
  // Message carries `content: string` + optional `providerOptions`.
  // We get exactly one cache breakpoint between the two messages —
  // which is all we need.
  //
  // 1h TTL matches a real user's session cadence: drafts, steps away
  // for 20 min, comes back. 5-min ephemeral would miss that use case.
  // Cache keys are exact-prefix; any byte drift in the cacheable half
  // invalidates — single-turn miss, next turn recovers.
  //
  // providerOptions passes through the Vercel AI Gateway to Anthropic
  // unchanged.
  // Q&A-sessies have no dynamic block — the prompt is byte-stable
  // turn-over-turn, so we skip the empty second system message
  // rather than send an empty-content one (Anthropic is lenient
  // but tidier is free).
  const systemMessages = [
    {
      role: "system" as const,
      content: systemPrompt.cacheable,
      providerOptions: {
        anthropic: {
          cacheControl: { type: "ephemeral" as const, ttl: "1h" as const },
        },
      },
    },
    ...(systemPrompt.dynamic
      ? [{ role: "system" as const, content: systemPrompt.dynamic }]
      : []),
  ];

  const result = streamText({
    model: gateway(CHAT_MODEL),
    system: systemMessages,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
    temperature: 0.6,
    abortSignal: userStopSignal.signal,
    // Throttled cancel poll. Fires on every streamed chunk (text delta
    // or tool event), throttleit caps it to max once per second. One
    // extra getById query per second of streaming is a cheap price for
    // true server-side cancellation that works with resume:true.
    onChunk: throttle(async () => {
      try {
        const latest = await Leercoach.Chat.getById({
          chatId: chat.chatId,
          userId: user.id,
        });
        if (latest?.canceledAt) userStopSignal.abort();
      } catch {
        // Defensive: a read failure shouldn't kill the stream. If the
        // DB is unreachable the user can always disconnect client-side.
      }
    }, 1000),
    // Log prompt-cache effectiveness so we can eyeball cache
    // activation without adding another metrics surface. Anthropic's
    // cache stats land on `providerMetadata.anthropic`:
    //   - cacheCreationInputTokens > 0 → cache MISS, we paid the 1.25×
    //     write cost this turn; next turn within TTL will hit
    //   - cacheReadInputTokens > 0 → cache HIT, we paid 0.1× for this
    //     portion of the prompt
    // Either of them being non-zero confirms the gateway is passing
    // cacheControl through to Anthropic. Zeros on both = either the
    // prefix was below the 1024-token minimum, or cacheControl is
    // being stripped somewhere upstream.
    onFinish: ({ providerMetadata, usage, finishReason, toolCalls }) => {
      const anthropic = providerMetadata?.anthropic as
        | {
            cacheCreationInputTokens?: number;
            cacheReadInputTokens?: number;
          }
        | undefined;
      if (anthropic) {
        console.log(
          `[chat ${chat.chatId}] cache stats — created=${
            anthropic.cacheCreationInputTokens ?? 0
          } read=${anthropic.cacheReadInputTokens ?? 0} input=${
            usage?.inputTokens ?? "?"
          } output=${usage?.outputTokens ?? "?"}`,
        );
      }
      // PostHog telemetry. Status mapping:
      //   userStopSignal aborted → the onChunk cancel-poll fired, so
      //     the turn was user-cancelled mid-stream.
      //   finishReason === "error" → stream terminated abnormally
      //     (rate limit, provider error, etc.).
      //   otherwise → normal completion (stop | length | tool-calls).
      captureAiTurn({
        userId: user.id,
        chatId: chat.chatId,
        callSite: "leercoach-chat",
        model: CHAT_MODEL,
        status: userStopSignal.signal.aborted
          ? "cancelled"
          : finishReason === "error"
            ? "errored"
            : "completed",
        durationMs: Date.now() - turnStartedAt,
        inputTokens: usage?.inputTokens ?? null,
        outputTokens: usage?.outputTokens ?? null,
        cacheReadTokens: anthropic?.cacheReadInputTokens ?? null,
        cacheCreateTokens: anthropic?.cacheCreationInputTokens ?? null,
        toolsAvailable: Object.keys(tools),
        toolCallCount: toolCalls?.length ?? 0,
        isQA,
        phase: chat.phase,
        scopeType: chat.scope?.type ?? null,
        errorCode: finishReason === "error" ? "stream_error" : undefined,
      });
    },
  });

  // Flush PostHog buffers after the response streams completely.
  // `after()` runs post-response on serverless runtimes so the lambda
  // doesn't shut down mid-flush. No-op when telemetry is disabled.
  after(flushAiTelemetry);

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    // crypto.randomUUID() instead of the AI SDK's default `generateId`
    // (nanoid-style). leercoach_message.id is `uuid NOT NULL`; the
    // assistant response saved in onFinish below must match that
    // format or the Zod uuidSchema in Message.save throws.
    generateMessageId: () => crypto.randomUUID(),
    onFinish: async ({ responseMessage, isContinuation }) => {
      // `responseMessage` is the single new-or-extended assistant
      // message for this turn (see AI SDK's UIMessageStreamOnFinish
      // type). Earlier versions of this route looped over the full
      // `messages` array, which the SDK defines as originalMessages +
      // responseMessage — so every previous turn got re-persisted on
      // every onFinish, producing ~N× row duplication in the DB.
      //
      // UPSERT on `id` covers both fresh messages (new id → INSERT)
      // and continuations (existing id → UPDATE parts). `isContinuation`
      // is logged for debug parity with the SDK's semantics; nothing
      // branches on it because the upsert handles both cases
      // identically.
      try {
        await Leercoach.Message.save({
          id: responseMessage.id,
          chatId: chat.chatId,
          role: responseMessage.role,
          parts: responseMessage.parts as Array<{
            type: string;
            [k: string]: unknown;
          }>,
        });
      } catch (err) {
        console.error(
          `Failed to persist assistant message (continuation=${isContinuation})`,
          err,
        );
      }
      // Stream terminated cleanly — clear the activeStreamId marker so
      // GET /stream knows there's nothing to reconnect to.
      try {
        await Leercoach.Chat.setActiveStreamId({
          chatId: chat.chatId,
          streamId: null,
        });
      } catch (err) {
        console.error("Failed to clear activeStreamId", err);
      }
    },
    async consumeSseStream({ stream }) {
      // Fork the SSE stream into a Redis-backed resumable sink. The
      // client gets the live stream via the HTTP response as usual;
      // in parallel, every chunk is published to Redis so the GET
      // /stream endpoint can replay to a reconnecting client.
      const streamId = generateId();
      const redis = getRedis();
      const streamContext = createResumableStreamContext({
        waitUntil: after,
        publisher: redis,
        subscriber: redis.duplicate(),
      });
      await streamContext.createNewResumableStream(streamId, () => stream);
      try {
        await Leercoach.Chat.setActiveStreamId({
          chatId: chat.chatId,
          streamId,
        });
      } catch (err) {
        // If we can't record the streamId, resume won't work for this
        // turn — but the primary stream still reaches the client.
        console.error("Failed to record activeStreamId", err);
      }
    },
  });
}
