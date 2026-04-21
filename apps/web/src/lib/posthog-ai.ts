import "server-only";
import posthog from "./posthog";

// Thin wrapper around posthog-node for LLM call-site telemetry.
//
// Two design rules that the callers rely on:
//
//   1. Never throw. A telemetry failure must not break an AI call;
//      every capture path is wrapped in try/catch and swallows errors.
//      We log to stderr so ops still sees repeated failures.
//   2. Feature-flagged via POSTHOG_AI_TELEMETRY=1. Off in dev by
//      default so local iteration doesn't pollute prod PostHog; flip
//      on in Vercel's prod env to start ingesting.
//
// Events land in PostHog with the distinct_id matching the Supabase
// auth user id — SessionProvider already calls posthog.identify() on
// sign-in, so server-captured events join up with client-side session
// history automatically.
//
// Dashboard math relies on these property names — keep them stable:
//   - call_site:        which AI surface produced the event
//   - model:            model id (centralised in ~/lib/ai-models)
//   - status:           completed | cancelled | errored
//   - duration_ms:      wall-clock request duration
//   - input/output_tokens, cache_read/create_tokens: from providerMetadata
//   - tool_call_count:  total tool invocations across all stream steps
//   - is_qa:            vraag-sessie vs portfolio-sessie (chat route only)
//
// New callers should go through captureAiTurn() rather than posthog
// directly so the shape stays uniform.

function isEnabled(): boolean {
  return process.env.POSTHOG_AI_TELEMETRY === "1";
}

export type AiCallSite =
  | "leercoach-chat"
  | "leercoach-synthesis"
  | "leercoach-compaction"
  | "profile-extract"
  | "portfolio-anonymisation"
  | "artefact-summary"
  | "portfolio-generator";

export type AiTurnStatus = "completed" | "cancelled" | "errored";

type CaptureAiTurnInput = {
  /**
   * Supabase auth user id. For system/background calls without an
   * authenticated user, pass null — the event is attributed to the
   * sentinel distinct id "system" so we can filter it in dashboards.
   */
  userId: string | null;
  /** Call site — always set, drives the primary dashboard filter. */
  callSite: AiCallSite;
  /** Model id from ai-models.ts (e.g. "anthropic/claude-sonnet-4-6"). */
  model: string;
  status: AiTurnStatus;
  /** Wall-clock duration in milliseconds. */
  durationMs: number;
  /** Leercoach chat id when applicable. */
  chatId?: string | null;
  /** Token counts from AI SDK usage. */
  inputTokens?: number | null;
  outputTokens?: number | null;
  /** Anthropic prompt-cache stats from providerMetadata. */
  cacheReadTokens?: number | null;
  cacheCreateTokens?: number | null;
  /** Tool names available to the model on this call. */
  toolsAvailable?: string[];
  /** How many tool invocations happened across stream steps. */
  toolCallCount?: number;
  /** Leercoach-chat-specific context. */
  isQA?: boolean;
  phase?: string;
  scopeType?: "full_profiel" | "kerntaak" | "kerntaken" | null;
  /** Error details for status=errored. */
  errorCode?: string;
  errorMessage?: string;
};

/**
 * Emit a single telemetry event for an AI call. Fire-and-forget —
 * posthog-node buffers and flushes, and the helper never throws.
 */
export function captureAiTurn(input: CaptureAiTurnInput): void {
  if (!isEnabled()) return;
  try {
    const event =
      input.status === "completed"
        ? "ai_turn_completed"
        : input.status === "cancelled"
          ? "ai_turn_cancelled"
          : "ai_turn_errored";

    posthog.capture({
      distinctId: input.userId ?? "system",
      event,
      properties: {
        call_site: input.callSite,
        model: input.model,
        status: input.status,
        duration_ms: input.durationMs,
        chat_id: input.chatId ?? null,
        input_tokens: input.inputTokens ?? null,
        output_tokens: input.outputTokens ?? null,
        cache_read_tokens: input.cacheReadTokens ?? null,
        cache_create_tokens: input.cacheCreateTokens ?? null,
        tools_available: input.toolsAvailable ?? null,
        tool_call_count: input.toolCallCount ?? 0,
        is_qa: input.isQA ?? null,
        phase: input.phase ?? null,
        scope_type: input.scopeType ?? null,
        error_code: input.errorCode ?? null,
        error_message: input.errorMessage ?? null,
      },
    });
  } catch (err) {
    // Never surface telemetry failures to the caller. Log for ops.
    console.error("[posthog-ai] capture failed", err);
  }
}

/**
 * Await in-flight PostHog requests before a serverless runtime
 * terminates. Our posthog-node client uses flushAt: 1 / flushInterval: 0
 * so the HTTP request starts immediately on capture — this awaits
 * the fetch so Vercel's serverless lambda doesn't kill it mid-flight.
 *
 * Wire into `after(() => flushAiTelemetry())` at the end of each
 * AI-emitting route handler.
 */
export async function flushAiTelemetry(): Promise<void> {
  if (!isEnabled()) return;
  try {
    await posthog.flush();
  } catch (err) {
    console.error("[posthog-ai] flush failed", err);
  }
}
