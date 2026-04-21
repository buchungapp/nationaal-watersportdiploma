"use client";

// Compound component for AI streaming chat UIs.
//
// Follows vercel-composition-patterns guidance:
//   - architecture-compound-components: pieces share context, no prop
//     drilling, no monolith
//   - architecture-avoid-boolean-props: no boolean toggles; consumers
//     compose the pieces they need
//   - patterns-children-over-render-props: custom UI lives as children;
//     the context gives access to sendMessage + isLoading
//   - state-context-interface: generic {state, actions, meta} contract
//     so alternative providers (future: streaming-test harness, server-
//     side rendered transcripts) can plug in the same pieces
//   - react19-no-forwardref: ref as regular prop; use() instead of
//     useContext()
//
// Consumer pattern:
//
//   <AiChat.Provider chatId={...} initialMessages={...} apiEndpoint="...">
//     <AiChat.Frame>
//       <AiChat.MessageList emptyState={<Welcome />} />
//       <AiChat.ErrorBanner />
//       <AiChat.Starters items={[...]} />
//       <UploadButton />   {/* uses useAiChatContext internally */}
//       <AiChat.InputForm />
//     </AiChat.Frame>
//   </AiChat.Provider>
//
// Or use the thin AiChatWindow wrapper for the default composition.

import { useChat } from "@ai-sdk/react";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  PaperAirplaneIcon,
  StopIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { DefaultChatTransport, type UIMessage } from "ai";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AiChatContext,
  type AiChatContextValue,
  type AiChatMessage,
  useAiChatContext,
} from "./context";
import { SimpleMarkdown } from "./markdown";
import { isToolPart, type ToolPart, ToolPartRenderer } from "./tool-parts";
import type {
  AiChatDropHandler,
  AiChatInitialMessage,
  AiChatPasteHandler,
  AiChatSlashCommand,
  AiChatStarter,
  AiChatSubmitBlock,
} from "./types";
import { useStickyScroll } from "./use-sticky-scroll";

// ---- Provider ----

type ProviderProps = {
  chatId: string;
  initialMessages: AiChatInitialMessage[];
  apiEndpoint: string;
  starters?: AiChatStarter[];
  onError?: (error: Error) => void;
  /**
   * Hook into the textarea's paste event. See `AiChatPasteHandler` for
   * contract. When omitted, pastes behave as they always did (content
   * drops into the textarea).
   */
  handlePaste?: AiChatPasteHandler;
  /**
   * Hook into file drops anywhere in the chat area. See
   * `AiChatDropHandler`. When omitted, drag-drop is inert (we still
   * block the browser's default "open this file" behaviour).
   */
  handleDrop?: AiChatDropHandler;
  /**
   * Consumer-supplied submit block. Non-null values disable the
   * submit button and prevent Enter-to-send until the consumer
   * clears it. Used by the artefact flow to prevent races between
   * "still uploading" and "sent the message".
   */
  submitBlock?: AiChatSubmitBlock;
  /**
   * Whether to automatically reconnect to any in-flight stream on
   * mount. When true, useChat issues a GET to the consumer's
   * resume/cancel endpoint (see `cancelEndpoint`) the moment the
   * Provider mounts, and picks up wherever the server left off.
   *
   * Only turn this on when the backend supports resumable streams
   * (the leercoach route does; generic consumers may not). Pairs
   * with a different request body shape — see the comment on
   * `prepareSendMessagesRequest` in the implementation below.
   *
   * Default: false (no auto-resume; matches the behaviour of a
   * fresh useChat).
   */
  resume?: boolean;
  /**
   * Builds the URL for the per-chat resume / cancel endpoint, which
   * must expose GET (replay the in-flight stream chunks) and DELETE
   * (flag the chat for server-side cancel).
   *
   * When provided:
   *   - `resume: true` uses this for the reconnect GET
   *   - the Stop button (below) fires a DELETE here alongside the
   *     local client-side abort
   *
   * When omitted, Stop only does a client-side abort (legacy
   * behaviour) and resume is impossible regardless of the `resume`
   * flag. Supplying both a `resume` and a `cancelEndpoint` keeps the
   * two capabilities in lockstep at the call site rather than
   * plumbing them independently.
   */
  cancelEndpoint?: (chatId: string) => string;
  children: ReactNode;
};

function Provider({
  chatId,
  initialMessages,
  apiEndpoint,
  starters = [],
  onError,
  handlePaste,
  handleDrop,
  submitBlock,
  resume = false,
  cancelEndpoint,
  children,
}: ProviderProps) {
  const [inputValue, setInputValue] = useState("");

  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    regenerate,
    clearError,
  } = useChat({
    id: chatId,
    messages: initialMessages as UIMessage[],
    resume,
    // Override the AI SDK's default id generator (nanoid-style,
    // e.g. "msg_4h3jk2h4") with a real UUID. The server's leercoach
    // message table stores `id uuid NOT NULL` and core's Zod schema
    // enforces uuidSchema, so non-UUID ids from the client's submit
    // path throw `Invalid uuid` on save. `crypto.randomUUID()` is
    // available in every modern browser + every Node runtime we
    // target, so no polyfill needed.
    generateId: () => crypto.randomUUID(),
    transport: new DefaultChatTransport({
      api: apiEndpoint,
      // Trigger-aware body shape required by resumable streams: the
      // server rebuilds history from the DB, so we only send the
      // latest delta (or just the messageId for regenerate). This
      // matches the Vercel reference example at
      // examples/next/app/api/chat/route.ts.
      //
      // The non-resumable path (older leercoach callers, hypothetical
      // future consumers) can tolerate the same shape — the server
      // interprets `submit-message` identically either way.
      prepareSendMessagesRequest: ({ id, messages: msgs, trigger, messageId }) => {
        switch (trigger) {
          case "regenerate-message":
            return { body: { id, trigger, messageId } };
          case "submit-message":
          default:
            return {
              body: {
                id,
                trigger: "submit-message",
                message: msgs[msgs.length - 1],
                messageId,
              },
            };
        }
      },
    }),
  });

  useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);

  const scrollContainerRef = useStickyScroll<HTMLDivElement>(messages);

  const isLoading = status === "streaming" || status === "submitted";

  // ---- Queued message (send-while-streaming) ----
  //
  // Single-slot queue: while the previous turn is still streaming,
  // submitting a new message stashes it here instead of being a no-op.
  // An effect watches `status` and flushes the queue via `sendMessage`
  // the instant the stream transitions back to "ready".
  //
  // The flush is deferred into a microtask to keep the synchronous
  // effect body free of state mutations (react-hooks/set-state-in-effect).
  const [queuedMessage, setQueuedMessage] = useState<{ text: string } | null>(
    null,
  );

  useEffect(() => {
    if (status !== "ready") return;
    if (queuedMessage === null) return;
    // Wait for any pending submit block (e.g. an upload started AFTER
    // the message was queued). The effect re-fires when submitBlock
    // transitions back to null, at which point we flush. No ref
    // needed — the microtask drains before React schedules another
    // render, so the captured `submitBlock` here is always current.
    if (submitBlock != null) return;
    const queued = queuedMessage;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setQueuedMessage(null);
      sendMessage({ text: queued.text });
    });
    return () => {
      cancelled = true;
    };
  }, [status, queuedMessage, sendMessage, submitBlock]);

  function submitCurrentInput() {
    const text = inputValue.trim();
    if (!text) return;
    // Submit block wins over everything — mirrors the InputForm's
    // disabled button behaviour so keyboard and click paths agree.
    if (submitBlock) return;
    if (isLoading) {
      // Queue: the previous turn isn't done yet. The effect above
      // fires this the moment status flips to "ready".
      setQueuedMessage({ text });
      setInputValue("");
      return;
    }
    sendMessage({ text });
    setInputValue("");
  }

  // Stop button behaviour:
  //   - Always: fire the client-side abort (disconnects this tab's
  //     fetch, drops the spinner immediately).
  //   - If a cancelEndpoint is configured: fire DELETE there too. The
  //     server flags canceledAt on the chat and the in-flight
  //     streamText loop picks it up within ~1s via a throttled poll,
  //     aborting the LLM call even though the client has disconnected.
  //
  // Without the second step, `resume: true` would cheerfully reconnect
  // the user to the stream they just tried to stop. The DELETE makes
  // Stop mean stop, even across tabs.
  function handleStop() {
    stop();
    if (!cancelEndpoint) return;
    // Fire-and-forget: the DELETE is advisory. If it fails (offline,
    // 5xx, …) the user can always click again, and the worst case is
    // the server finishes a stream the user didn't want.
    void fetch(cancelEndpoint(chatId), { method: "DELETE" }).catch(() => {
      /* swallow */
    });
  }

  // Compaction info only lives on the initial messages (server-
  // rendered). New messages produced by the live stream never carry
  // it, so we merge from a stable map keyed on message id.
  //
  // useMemo with initialMessages as dep — the identity is stable
  // between renders unless the consumer actually re-keys the chat,
  // which would also reset useChat. So this map is computed once per
  // effective mount.
  const compactionByMessageId = useMemo(() => {
    const map = new Map<string, NonNullable<AiChatMessage["compaction"]>>();
    for (const m of initialMessages) {
      if (m.compaction) map.set(m.id, m.compaction);
    }
    return map;
  }, [initialMessages]);

  const messagesWithCompaction = useMemo<AiChatMessage[]>(() => {
    return (messages as AiChatMessage[]).map((m) => {
      const compaction = compactionByMessageId.get(m.id);
      return compaction ? { ...m, compaction } : m;
    });
  }, [messages, compactionByMessageId]);

  const value: AiChatContextValue = {
    state: {
      messages: messagesWithCompaction,
      inputValue,
      status,
      error,
      starters,
      queuedMessage,
    },
    actions: {
      sendMessage: (input) => sendMessage(input),
      setInputValue,
      submitCurrentInput,
      stop: handleStop,
      regenerate: () => regenerate(),
      clearError: () => clearError(),
      queueMessage: (input) => setQueuedMessage({ text: input.text }),
      cancelQueuedMessage: () => setQueuedMessage(null),
      handlePaste: handlePaste ?? null,
      handleDrop: handleDrop ?? null,
    },
    meta: {
      isLoading,
      scrollContainerRef,
      submitBlock: submitBlock ?? null,
    },
  };

  return <AiChatContext value={value}>{children}</AiChatContext>;
}

// ---- Frame ----

function Frame({
  children,
  className,
}: { children: ReactNode; className?: string }) {
  const { handleDrop } = useAiChatContext().actions;
  const [dragActive, setDragActive] = useState(false);
  // Counter handles the Safari/Chrome quirk where dragleave fires when
  // the cursor crosses into a child element. Increment on enter, dec
  // on leave — we're only "truly out" when the count hits zero.
  const dragCounter = useRef(0);

  function hasDraggedFiles(e: React.DragEvent): boolean {
    // `dataTransfer.types` is a DOMStringList during dragenter/over;
    // items aren't readable yet for security reasons. "Files" is the
    // marker for a file drag.
    const types = e.dataTransfer?.types;
    if (!types) return false;
    for (let i = 0; i < types.length; i++) {
      if (types[i] === "Files") return true;
    }
    return false;
  }

  return (
    <div
      // Frame is intentionally chrome-less (no border / rounded /
      // shadow / own background). The consumer owns the outer card
      // — in leercoach, the whole chat+doc layout sits inside one
      // unified card that the UnifiedToolbar + panels share. If we
      // added our own border here, it'd be a card-in-card nest.
      //
      // `pb-[env(safe-area-inset-bottom)]` keeps the composer clear of
      // the iPhone home indicator in full-bleed PWA / landscape modes.
      // Zero on devices without a safe area, so desktop is unaffected.
      className={`relative flex flex-1 flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]${
        className ? ` ${className}` : ""
      }`}
      onDragEnter={(e) => {
        if (!handleDrop) return;
        if (!hasDraggedFiles(e)) return;
        e.preventDefault();
        dragCounter.current += 1;
        if (dragCounter.current === 1) setDragActive(true);
      }}
      onDragOver={(e) => {
        // Required: without preventDefault the drop event never fires.
        if (!handleDrop) return;
        if (!hasDraggedFiles(e)) return;
        e.preventDefault();
        // Explicit copy effect — drops into an input area are "copy",
        // not "move" or "link".
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        if (!handleDrop) return;
        if (!hasDraggedFiles(e)) return;
        e.preventDefault();
        dragCounter.current = Math.max(0, dragCounter.current - 1);
        if (dragCounter.current === 0) setDragActive(false);
      }}
      onDrop={(e) => {
        // preventDefault unconditionally: without this, dropping onto
        // a page navigates the browser to the file:// URL. Do this
        // even when no handler is registered so we don't break the
        // user's session by accident.
        e.preventDefault();
        dragCounter.current = 0;
        setDragActive(false);
        if (!handleDrop) return;
        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) return;
        void handleDrop(Array.from(files));
      }}
    >
      {children}
      {dragActive ? <DragOverlay /> : null}
    </div>
  );
}

function DragOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/80 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-2 rounded-xl bg-white/90 px-6 py-4 text-sm shadow-lg">
        <ArrowDownTrayIcon className="size-6 text-blue-600" />
        <p className="font-semibold text-slate-900">Drop om toe te voegen</p>
        <p className="text-xs text-slate-600">
          PDF, DOCX of afbeelding · max 15 MB
        </p>
      </div>
    </div>
  );
}

// ---- MessageList ----

function MessageList({ emptyState }: { emptyState?: ReactNode }) {
  const {
    state: { messages, queuedMessage },
    actions: { cancelQueuedMessage },
    meta: { scrollContainerRef },
  } = useAiChatContext();

  // Index of the last assistant message — used by MessageItem to
  // decide where the "Opnieuw proberen" affordance lives. Copy lives
  // on EVERY assistant bubble, but regenerate is only meaningful on
  // the most recent one.
  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") return i;
    }
    return -1;
  })();

  return (
    <div
      ref={scrollContainerRef}
      // `overscroll-contain` stops iOS rubber-band scrolling from
      // bleeding past the message list into the page body, which
      // was pulling the whole dashboard behind the chat.
      // Scroll container spans full pane width so scrollbar + white
      // bleed stay at the edges — Claude/ChatGPT pattern. Actual
      // message content is constrained below.
      className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
    >
      {/* Centered reading column for chat content. Background stays
          full-bleed via the parent's white surface; text is capped
          at ~max-w-3xl (48rem / 768 px) so long lines don't span a
          2500-px wide pane. Matches Claude's chat typography. */}
      <div className="mx-auto w-full max-w-3xl">
        {messages.length === 0 ? (
          (emptyState ?? <DefaultEmptyState />)
        ) : (
          <ul className="flex flex-col gap-4">
            {messages.map((m, i) => (
              <MessageItem
                key={m.id}
                message={m}
                isLastAssistant={i === lastAssistantIdx}
              />
            ))}
            {queuedMessage ? (
              <QueuedBubble
                text={queuedMessage.text}
                onCancel={cancelQueuedMessage}
              />
            ) : null}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---- MessageItem ----
//
// Single chat row. Owns its own bubble ref so child actions (copy)
// can read the rendered HTML out of the DOM for rich-text clipboard
// writes. User messages are the same markup minus the assistant-only
// action row; the ref still mounts but is unused on the user path.
//
// Compaction-aware branches:
//   - compaction.kind === "summary"  → render as a horizontal
//     divider-banner (NOT a chat bubble). The model sees this as a
//     user turn with <summary> tags; the UI shows it as structural
//     chrome explaining "older messages are summarised here".
//   - compaction.kind === "folded"   → render the bubble but faded
//     + no action row. Audit-friendly: the user can still read what
//     was said, while clearly marked as "not active context".
//   - no compaction                  → ordinary bubble.
function MessageItem({
  message,
  isLastAssistant,
}: {
  message: AiChatMessage;
  isLastAssistant: boolean;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const isUser = message.role === "user";

  if (message.compaction?.kind === "summary") {
    return <CompactionSummaryItem info={message.compaction} parts={message.parts} />;
  }

  const folded = message.compaction?.kind === "folded";

  return (
    <li className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Column wrapper so the action row sits directly under the
          bubble at the same max-width, not floating anywhere in the
          chat area. */}
      <div
        className={`flex max-w-[85%] flex-col gap-1 ${folded ? "opacity-55" : ""}`}
        title={folded ? "Samengevat — dit bericht wordt niet meer meegestuurd naar de coach." : undefined}
      >
        <div
          ref={bubbleRef}
          className={`rounded-xl px-4 py-3 text-sm ${
            isUser
              ? "bg-blue-600 text-white"
              : // Assistant bubbles stream in progressively —
                // hug-content would visibly reflow the bubble width on
                // every tick. `w-full` pins to the 85% max so the
                // bubble width is stable regardless of content length.
                // `min-w-0` lets long words break instead of blowing
                // out the flex child.
                "w-full min-w-0 bg-slate-100 text-slate-900"
          }`}
        >
          <RenderMessageParts parts={message.parts} />
        </div>
        {!isUser && !folded ? (
          <AssistantActions
            message={message}
            bubbleRef={bubbleRef}
            isLast={isLastAssistant}
          />
        ) : null}
      </div>
    </li>
  );
}

// ---- CompactionSummaryItem ----
//
// Renders where the server has inserted a synthetic "summary" row.
// Visually a horizontal divider with a label + hover tooltip; not a
// chat bubble. The raw summary text (wrapped in <summary>...</summary>
// by the compaction endpoint) is kept in `parts` so the model can
// still read it on the next turn — here we show a compact, non-
// scary marker instead of dumping the summary prose into the
// transcript.
function CompactionSummaryItem({
  info,
  parts,
}: {
  info: Extract<NonNullable<AiChatMessage["compaction"]>, { kind: "summary" }>;
  parts: unknown[];
}) {
  const [expanded, setExpanded] = useState(false);
  const summaryText = useMemo(() => {
    if (!Array.isArray(parts)) return "";
    const chunks: string[] = [];
    for (const p of parts) {
      if (isTextPart(p)) chunks.push(p.text);
    }
    return chunks.join("").replace(/<\/?summary>/g, "").trim();
  }, [parts]);

  return (
    <li
      className="my-2 flex flex-col gap-1"
      // Live region so screen readers announce the compaction marker
      // when it appears without being intrusive during normal reads.
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={
            expanded ? "Samenvatting verbergen" : "Samenvatting tonen"
          }
          title={`Samengevat: ${info.messageCount} bericht${
            info.messageCount === 1 ? "" : "en"
          }, ~${Math.round(info.tokensSaved / 1000)}k tokens bespaard`}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <span>
            {info.messageCount} oudere bericht
            {info.messageCount === 1 ? "" : "en"} samengevat
          </span>
          <span aria-hidden="true" className="text-slate-400">
            {expanded ? "✕" : "▸"}
          </span>
        </button>
        <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
      </div>
      {expanded && summaryText ? (
        <div className="mx-auto max-w-[85%] rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs leading-relaxed text-slate-600 whitespace-pre-wrap">
          {summaryText}
        </div>
      ) : null}
    </li>
  );
}

// ---- AssistantActions ----
//
// Inline toolbar under an assistant bubble. Two affordances:
//   - Copy (every assistant message, whenever there's text to copy)
//   - Opnieuw proberen (only on the LATEST assistant, and only when
//     the chat is idle — you can't regenerate while the model is
//     still producing the current message)
//
// Copy writes BOTH text/plain (markdown source) and text/html (the
// rendered DOM) to the clipboard. Google Docs and other rich editors
// pick the HTML, preserving headers / bold / lists; plain-text
// editors fall back to the markdown source.
function AssistantActions({
  message,
  bubbleRef,
  isLast,
}: {
  message: AiChatMessage;
  bubbleRef: React.RefObject<HTMLDivElement | null>;
  isLast: boolean;
}) {
  const {
    state: { status },
    actions: { regenerate },
    meta: { isLoading },
  } = useAiChatContext();

  const markdown = useMemo(
    () => extractPlainMarkdown(message.parts),
    [message.parts],
  );
  const hasContent = markdown.trim().length > 0;
  const canRegenerate = isLast && !isLoading && status === "ready";

  if (!hasContent && !canRegenerate) return null;

  return (
    <div className="flex justify-start gap-1">
      {hasContent ? (
        <CopyButton markdown={markdown} bubbleRef={bubbleRef} />
      ) : null}
      {canRegenerate ? (
        <button
          type="button"
          onClick={regenerate}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowPathIcon aria-hidden="true" className="size-3.5" />
          <span>Opnieuw proberen</span>
        </button>
      ) : null}
    </div>
  );
}

// ---- CopyButton ----
//
// Writes the assistant message to the clipboard with both a rich
// (text/html) and plain (text/plain) representation. Paste target
// picks whichever it supports:
//   - Google Docs, Notion, Gmail, Word: honour text/html → keep
//     headings, lists, bold, italics, blockquotes.
//   - Plain text editors (vi, raw textarea, …): fall back to
//     text/plain, which is the original markdown source.
//
// The HTML is read from the bubble's innerHTML — i.e. exactly what
// the user sees on screen, including streamdown's rendering. Any
// Tailwind classes ride along but are ignored by all the paste
// targets we care about.
function CopyButton({
  markdown,
  bubbleRef,
}: {
  markdown: string;
  bubbleRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      const html = bubbleRef.current?.innerHTML;
      if (
        html &&
        typeof ClipboardItem !== "undefined" &&
        navigator.clipboard?.write
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": new Blob([markdown], { type: "text/plain" }),
            "text/html": new Blob([html], { type: "text/html" }),
          }),
        ]);
      } else if (navigator.clipboard?.writeText) {
        // Older browsers: plain text only. User still gets the
        // markdown source, just loses rich paste.
        await navigator.clipboard.writeText(markdown);
      } else {
        return;
      }
      setCopied(true);
      // 1.5s matches common "copied!" ack patterns — long enough to
      // read, short enough to not linger as visual noise.
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard write can reject for permission reasons (iframe,
      // no user gesture, insecure context). User can still
      // select-all + Cmd+C as a manual fallback.
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={copied ? "Gekopieerd" : "Kopieer bericht"}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
    >
      {copied ? (
        <>
          <CheckIcon aria-hidden="true" className="size-3.5 text-emerald-600" />
          <span>Gekopieerd</span>
        </>
      ) : (
        <>
          <ClipboardDocumentIcon aria-hidden="true" className="size-3.5" />
          <span>Kopieer</span>
        </>
      )}
    </button>
  );
}

// Join all text parts of a message into a single markdown string.
// Tool parts and step markers are intentionally skipped — they're
// the model's internal plumbing (search results, phase changes), not
// content the user wants in their Google Doc.
function extractPlainMarkdown(parts: unknown): string {
  if (!Array.isArray(parts)) return "";
  const chunks: string[] = [];
  for (const part of parts) {
    if (isTextPart(part)) chunks.push(part.text);
  }
  return chunks.join("");
}

// ---- QueuedBubble ----
//
// Pseudo-user bubble rendered at the tail of the message list when
// something is waiting in the queue slot. Visually distinct from a
// sent message:
//   - dimmed blue background (bg-blue-600/60) so it reads as "not yet
//     committed" without losing the user-bubble side + colour
//   - a small pill ("Staat in de wachtrij") so the state is explicit,
//     not just a subtle opacity shift
//   - inline × cancel button so the user can withdraw before flush
//
// Placement at the end of the <ul> means it sits under the last
// assistant turn (still streaming or not), which matches how
// Claude/ChatGPT-style UIs position pending user messages.
function QueuedBubble({
  text,
  onCancel,
}: {
  text: string;
  onCancel: () => void;
}) {
  return (
    <li className="flex justify-end">
      <div className="flex max-w-[85%] flex-col gap-2 rounded-xl bg-blue-600/60 px-4 py-3 text-sm text-white">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-white/90">
            Staat in de wachtrij
          </span>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Bericht uit de wachtrij halen"
            // Touch-first tap target sized for finger use (~32px),
            // visually quiet so it doesn't compete with the message
            // content for attention.
            className="inline-flex size-6 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            <XMarkIcon aria-hidden="true" className="size-4" />
          </button>
        </div>
        <p className="whitespace-pre-wrap break-words">{text}</p>
      </div>
    </li>
  );
}

function DefaultEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-600">
      <p className="font-semibold text-slate-900">Klaar om te beginnen.</p>
      <p>Stel een vraag of beschrijf waar je aan wilt werken.</p>
    </div>
  );
}

function RenderMessageParts({ parts }: { parts: unknown }) {
  if (!Array.isArray(parts)) return null;
  return (
    <>
      {parts.map((part, i) => {
        if (isTextPart(part)) {
          return (
            <SimpleMarkdown
              key={`text-${i}-${part.text.slice(0, 20)}`}
              text={part.text}
            />
          );
        }
        if (isToolPart(part)) {
          return (
            <ToolPartRenderer
              key={`tool-${(part as ToolPart).toolCallId ?? i}`}
              part={part as ToolPart}
            />
          );
        }
        // AI SDK plumbing: step-start / step-end / step-finish markers
        // surround each model reasoning step (tool call → tool result →
        // text). They carry no user-visible content — skip silently
        // rather than dumping their JSON into the transcript.
        if (isStepMarkerPart(part)) return null;
        return (
          <pre
            key={`other-${i}`}
            className="mt-2 whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs text-slate-700"
          >
            {JSON.stringify(part, null, 2)}
          </pre>
        );
      })}
    </>
  );
}

function isStepMarkerPart(part: unknown): boolean {
  return (
    part !== null &&
    typeof part === "object" &&
    "type" in part &&
    typeof (part as { type: unknown }).type === "string" &&
    (part as { type: string }).type.startsWith("step-")
  );
}

function isTextPart(part: unknown): part is { type: "text"; text: string } {
  return (
    part !== null &&
    typeof part === "object" &&
    "type" in part &&
    (part as { type: unknown }).type === "text" &&
    "text" in part &&
    typeof (part as { text: unknown }).text === "string"
  );
}

// ---- ErrorBanner ----

// Signature for consumer-supplied custom retry renderers. Lets a
// specific error class (e.g. context-limit) trigger a domain action
// instead of the generic retry — e.g. "Comprimeer en probeer opnieuw"
// in leercoach, which compacts the chat then regenerates.
export type AiChatErrorRetryRenderer = (args: {
  error: Error;
  /** Invokes the default useChat regenerate(). */
  defaultRetry: () => void;
  /** True while a stream is in flight; typical custom renderers respect it. */
  isLoading: boolean;
}) => ReactNode;

function ErrorBanner({
  renderRetryAction,
}: {
  /**
   * Optional override for the retry affordance. When provided AND
   * returns non-null, replaces the default "Probeer opnieuw" button.
   * The close (×) stays either way.
   */
  renderRetryAction?: AiChatErrorRetryRenderer;
}) {
  const {
    state: { error },
    actions: { regenerate, clearError },
    meta: { isLoading },
  } = useAiChatContext();
  if (!error) return null;

  const customRetry = renderRetryAction
    ? renderRetryAction({ error, defaultRetry: regenerate, isLoading })
    : null;

  return (
    <div
      aria-live="polite"
      className="flex flex-col gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Er ging iets mis</p>
        <p className="mt-1 break-words font-mono text-xs">{error.message}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {customRetry ?? (
          <button
            type="button"
            onClick={regenerate}
            disabled={isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 shadow-sm transition-colors hover:border-red-400 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon aria-hidden="true" className="size-3.5" />
            <span>Probeer opnieuw</span>
          </button>
        )}
        <button
          type="button"
          onClick={clearError}
          aria-label="Sluiten"
          className="rounded-md p-1 text-red-600 transition-colors hover:bg-red-100 hover:text-red-900"
        >
          <XMarkIcon aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ---- Starters ----

function Starters() {
  const {
    state: { messages, starters },
    actions: { sendMessage },
    meta: { isLoading },
  } = useAiChatContext();

  const userTurnCount = messages.filter((m) => m.role === "user").length;
  if (userTurnCount > 0) return null;
  if (!starters || starters.length === 0) return null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Of begin met een van deze
      </p>
      <div className="flex flex-wrap gap-2">
        {starters.map((s) => (
          <button
            key={s.label}
            type="button"
            disabled={isLoading}
            onClick={() => sendMessage({ text: s.prompt })}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- InputForm ----

// Any paste with more plain text than this gets promoted to an
// attachment (via the consumer's `handlePaste`) instead of landing in
// the textarea. Matches the Raycast/ChatGPT threshold — below this
// the content still feels like a typed message; above it, it's a
// document.
const PASTE_PROMOTION_THRESHOLD_CHARS = 1500;

type InputFormProps = {
  placeholder?: string;
  /**
   * Content rendered INSIDE the composer's rounded container, above
   * the textarea. Used by the leercoach to render the artefact chip
   * strip (uploaded files for the current draft) right where Claude
   * shows attachments — inside the composer border, not floating
   * above it.
   */
  topChildren?: ReactNode;
  /**
   * Content rendered absolute-positioned at the bottom-LEFT of the
   * composer (mirroring the built-in send button at bottom-right).
   * The leercoach uses this for the "+" attach menu. When set, the
   * textarea gets `pl-12` reserve so typed text never slides under
   * this element.
   */
  leftActions?: ReactNode;
  /**
   * Consumer-supplied slash commands. When non-empty and the
   * textarea content starts with `/`, a floating menu appears above
   * the composer showing filtered matches. See `AiChatSlashCommand`.
   */
  slashCommands?: AiChatSlashCommand[];
};

function InputForm({
  placeholder = "Typ je bericht… (shift+enter voor een nieuwe regel, esc om te stoppen)",
  topChildren,
  leftActions,
  slashCommands = [],
}: InputFormProps) {
  const {
    state: { inputValue },
    actions: {
      setInputValue,
      submitCurrentInput,
      stop,
      handlePaste,
      regenerate,
    },
    meta: { isLoading, submitBlock },
  } = useAiChatContext();

  // ---- Slash menu state ----
  //
  // The menu opens when the textarea content is exactly `/` or
  // `/<letters>` (no space yet). First space or any non-slash prefix
  // closes it. Filter is case-insensitive substring match against
  // trigger OR label, so `/con` finds `concept` and `/op` finds
  // `opnieuw`.
  const slashQuery = (() => {
    if (slashCommands.length === 0) return null;
    if (!inputValue.startsWith("/")) return null;
    const afterSlash = inputValue.slice(1);
    if (afterSlash.includes(" ") || afterSlash.includes("\n")) return null;
    return afterSlash.toLowerCase();
  })();
  const filteredSlashCommands =
    slashQuery === null
      ? []
      : slashCommands.filter(
          (c) =>
            c.trigger.toLowerCase().includes(slashQuery) ||
            c.label.toLowerCase().includes(slashQuery),
        );
  const slashMenuOpen =
    slashQuery !== null && filteredSlashCommands.length > 0;
  const [slashHighlightRaw, setSlashHighlight] = useState(0);
  // Clamp the highlight to the current filter length every render.
  // Avoids a synchronous setState-in-effect (flagged by
  // react-hooks/set-state-in-effect) while still keeping the index
  // in range as the filter shrinks.
  const slashHighlight =
    filteredSlashCommands.length === 0
      ? 0
      : Math.min(slashHighlightRaw, filteredSlashCommands.length - 1);

  function applySlashCommand(cmd: AiChatSlashCommand) {
    if (cmd.kind === "template") {
      setInputValue(cmd.template);
      return;
    }
    // Client action.
    if (cmd.actionId === "regenerate") {
      setInputValue("");
      regenerate();
    }
  }

  // When a consumer has blocked submission (e.g. artefact still
  // uploading), Enter is a no-op and the submit button is disabled.
  // This runs AFTER the `isLoading` short-circuit so Stop still works
  // mid-stream even if a race puts both states true simultaneously.
  const submitBlocked = submitBlock !== null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitBlocked) return;
    // `submitCurrentInput` now routes to either sendMessage (idle) or
    // queueMessage (streaming) based on isLoading — Enter during a
    // stream queues instead of stopping it. Users who truly want to
    // stop hit the Stop button or Esc.
    submitCurrentInput();
  }

  function onTextareaPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    if (!handlePaste) return;
    const items = e.clipboardData?.items;
    // Image-first: if the clipboard carries an image (OS screenshot,
    // "Copy image", etc.), promote THAT ahead of any accompanying text
    // the app might have added to the clipboard.
    if (items) {
      for (const item of Array.from(items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            void handlePaste({ kind: "image", file });
            return;
          }
        }
      }
    }
    const text = e.clipboardData?.getData("text/plain") ?? "";
    if (text.length > PASTE_PROMOTION_THRESHOLD_CHARS) {
      e.preventDefault();
      void handlePaste({ kind: "text", content: text });
    }
    // Short pastes fall through to the browser default — content
    // lands in the textarea as typed text.
  }

  return (
    // Composer is now an inline section of the parent Frame card,
    // not a standalone card of its own. The Frame owns the chat-level
    // border + rounded corners + shadow; we just mark the composer's
    // top edge with a subtle border to separate it from the messages
    // above. A very light focus tint (`focus-within:bg-slate-50/40`)
    // gives a breath of feedback without competing with the textarea
    // cursor for attention — which is the right affordance now that
    // the composer isn't a discrete card begging to be rung by a ring.
    <form
      onSubmit={handleSubmit}
      className="border-t border-slate-200 transition-colors focus-within:bg-slate-50/40"
    >
      {/* Centered inner container: caps chat-content width at the
          same max-w-3xl the message list uses so a wide pane doesn't
          let the composer sprawl. Background + top border stay on
          the outer form so they still span the full pane. `relative`
          because SlashMenu + left/right action buttons position
          themselves against this container's edges (so they hug the
          textarea, not the full pane). */}
      <div className="relative mx-auto w-full max-w-3xl">
        {slashMenuOpen ? (
          <SlashMenu
            commands={filteredSlashCommands}
            highlightedIndex={slashHighlight}
            onHighlight={setSlashHighlight}
            onSelect={applySlashCommand}
          />
        ) : null}
        {topChildren ? (
          // Chip-strip row renders inside the composer's vertical
          // stack, above the textarea. Its own bottom hairline
          // separates it from the typing area. No rounded corners
          // here — the parent Frame owns those.
          <div className="border-b border-slate-100 bg-slate-50/60 px-3 py-2">
            {topChildren}
          </div>
        ) : null}
        <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onPaste={onTextareaPaste}
        onKeyDown={(e) => {
          // ---- Slash menu (highest priority; grabs keys before
          //      any of the submit/stop/shift+enter handlers) ----
          if (slashMenuOpen) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSlashHighlight((i) =>
                Math.min(i + 1, filteredSlashCommands.length - 1),
              );
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSlashHighlight((i) => Math.max(i - 1, 0));
              return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              const cmd = filteredSlashCommands[slashHighlight];
              if (cmd) applySlashCommand(cmd);
              return;
            }
            if (e.key === "Escape") {
              e.preventDefault();
              // Clear the slash prefix — user bailed on the command.
              setInputValue("");
              return;
            }
            // Any other key (letters, backspace, etc.) falls through
            // to the textarea, refining the filter via onChange.
          }
          // Esc aborts the in-flight stream. Works whether the textarea
          // is empty or not, so a user who accidentally hit Enter can
          // immediately cancel without first clearing their input.
          if (e.key === "Escape" && isLoading) {
            e.preventDefault();
            stop();
            return;
          }
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (submitBlocked) {
              // Swallow the Enter: the form isn't ready to submit.
              // The user sees the disabled button + tooltip as the
              // explanation. Typing continues uninterrupted.
              return;
            }
            // Idle → send. Streaming → queue. `submitCurrentInput`
            // owns that branch, so Enter is the same "commit my turn"
            // gesture either way.
            submitCurrentInput();
          }
        }}
        placeholder={placeholder}
        rows={1}
        // Keep the textarea usable during streaming so the user can
        // start drafting their next message while the model finishes
        // (or abort mid-stream and edit).
        //
        // Auto-grow: `field-sizing-content` makes the element track its
        // own content height (Tailwind 4 utility, CSS spec). `rows={1}`
        // sets the empty-state baseline to a single line so the inlined
        // action button sits naturally beside the placeholder — a
        // higher row count leaves a big empty gap to the button's
        // opposite corner. `max-h-64` caps at ~16rem so a runaway
        // paste doesn't take over the chat area — internal scroll
        // kicks in past that. `resize-none` disables the manual drag
        // handle since content drives size. `pr-12` leaves room for
        // the 32px icon button bottom-right.
        // `touch-manipulation` removes the ~300 ms double-tap-zoom
        // delay mobile browsers add to ordinary tap targets —
        // noticeable friction in a chat where each message is a
        // deliberate submit.
        //
        // Padding: `pr-12` always reserves space for the send button
        // bottom-right. `pl-12` is conditional on `leftActions` so the
        // textarea stays flush-left when no left-action slot is used.
        // No rounded corners on the textarea itself — the parent
        // Frame owns the chat card's rounding now; adding them here
        // would fight the bottom edge of the card at the composer
        // floor.
        className={`block w-full resize-none field-sizing-content max-h-64 touch-manipulation overflow-y-auto overscroll-contain bg-transparent py-3 ${
          leftActions ? "pl-12" : "pl-3"
        } pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none`}
      />
      {/* Icon button sits in the bottom-right corner. 32px square
          (size-8) fits cleanly inside a single-line input without
          poking above/below the baseline — a text-sized button was
          too tall for this layout.
          Positioning: `bottom-1` (4px) + textarea `py-3` (24px vertical
          padding) + ~17.5px text-sm line-height yields a 41.5px
          single-line container with the button sitting ~5.5px from
          the top and 4px from the bottom — close enough to centre to
          read as aligned. When the textarea grows multi-line the
          button stays anchored at the bottom-right (where send
          buttons conventionally belong) instead of floating in the
          middle. */}
        {leftActions ? (
          // Mirror of the send-button position, on the left. Consumer
          // supplies a single actionable element (button or menu
          // trigger); we just anchor + size-match it to the send button
          // via `size-8` by convention. `bottom-1 left-1.5` matches the
          // opposite corner exactly.
          <div className="absolute bottom-1 left-1.5">{leftActions}</div>
        ) : null}
        <div className="absolute bottom-1 right-1.5">
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              aria-label="Stop met genereren"
              className="flex size-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              <StopIcon aria-hidden="true" className="size-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputValue.trim() || submitBlocked}
              aria-label="Verstuur bericht"
              title={submitBlock?.reason}
              className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PaperAirplaneIcon aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

// ---- SlashMenu ----
//
// Floating command picker above the composer, filtered by the
// characters after the slash. Keyboard navigation is handled by
// InputForm's onKeyDown (ArrowUp/Down/Enter/Tab/Escape); this
// component is purely presentational and also supports mouse
// click-to-select.

function SlashMenu({
  commands,
  highlightedIndex,
  onHighlight,
  onSelect,
}: {
  commands: AiChatSlashCommand[];
  highlightedIndex: number;
  onHighlight: (i: number) => void;
  onSelect: (cmd: AiChatSlashCommand) => void;
}) {
  // Refs to each item so we can scroll the highlighted one into view
  // when ArrowUp/Down changes the index. The container has its own
  // `overflow-y-auto` so `scrollIntoView({ block: "nearest" })`
  // scrolls just the list, not the page.
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  useEffect(() => {
    const el = itemRefs.current[highlightedIndex];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  return (
    <div
      // Anchor to the composer top edge, float ABOVE the form.
      // `left-1 right-1` to match the composer's side padding; the
      // menu itself caps at ~22rem so on wide viewports it doesn't
      // stretch the full composer width awkwardly.
      className="absolute bottom-full left-1 mb-2 w-[min(22rem,calc(100%-0.5rem))] overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-lg"
      role="listbox"
      aria-label="Slash-opdrachten"
    >
      <ul className="max-h-72 overflow-y-auto p-1">
        {commands.map((cmd, i) => {
          const isActive = i === highlightedIndex;
          return (
            <li
              key={cmd.trigger}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
            >
              <button
                type="button"
                onMouseEnter={() => onHighlight(i)}
                // `onMouseDown` rather than `onClick` so the textarea
                // doesn't lose focus before we act — tired React idiom
                // for popover clicks.
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(cmd);
                }}
                role="option"
                aria-selected={isActive}
                className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                  isActive ? "bg-slate-100" : "bg-transparent"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-slate-500">
                      /{cmd.trigger}
                    </span>
                    <span className="font-medium text-slate-900">
                      {cmd.label}
                    </span>
                  </span>
                  {cmd.description ? (
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {cmd.description}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---- Compound export ----

export const AiChat = {
  Provider,
  Frame,
  MessageList,
  ErrorBanner,
  Starters,
  InputForm,
};

export { isTextPart };
