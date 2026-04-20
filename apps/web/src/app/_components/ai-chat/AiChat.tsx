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
  PaperAirplaneIcon,
  StopIcon,
} from "@heroicons/react/20/solid";
import { DefaultChatTransport, type UIMessage } from "ai";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
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
  children,
}: ProviderProps) {
  const [inputValue, setInputValue] = useState("");

  const { messages, sendMessage, status, error, stop } = useChat({
    id: chatId,
    messages: initialMessages as UIMessage[],
    transport: new DefaultChatTransport({
      api: apiEndpoint,
      prepareSendMessagesRequest: ({ messages: msgs, id }) => ({
        body: { id, messages: msgs },
      }),
    }),
  });

  useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);

  const scrollContainerRef = useStickyScroll<HTMLDivElement>(messages);

  const isLoading = status === "streaming" || status === "submitted";

  function submitCurrentInput() {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInputValue("");
  }

  const value: AiChatContextValue = {
    state: {
      messages: messages as AiChatMessage[],
      inputValue,
      status,
      error,
      starters,
    },
    actions: {
      sendMessage: (input) => sendMessage(input),
      setInputValue,
      submitCurrentInput,
      stop: () => stop(),
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
      // `pb-[env(safe-area-inset-bottom)]` keeps the composer clear of
      // the iPhone home indicator in full-bleed PWA / landscape modes.
      // Zero on devices without a safe area, so desktop is unaffected.
      className={`relative flex flex-1 flex-col gap-4 overflow-hidden pb-[env(safe-area-inset-bottom)]${
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
    state: { messages },
    meta: { scrollContainerRef },
  } = useAiChatContext();

  return (
    <div
      ref={scrollContainerRef}
      // `overscroll-contain` stops iOS rubber-band scrolling from
      // bleeding past the message list into the page body, which
      // was pulling the whole dashboard behind the chat.
      className="flex-1 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-4"
    >
      {messages.length === 0 ? (
        (emptyState ?? <DefaultEmptyState />)
      ) : (
        <ul className="flex flex-col gap-4">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : // Assistant bubbles stream in progressively —
                      // hug-content would visibly reflow the bubble
                      // width on every tick. `w-full` pins to the 85%
                      // max so the bubble width is stable regardless
                      // of content length. `min-w-0` lets long words
                      // break instead of blowing out the flex child.
                      "w-full min-w-0 bg-slate-100 text-slate-900"
                }`}
              >
                <RenderMessageParts parts={m.parts} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
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

function ErrorBanner() {
  const {
    state: { error },
  } = useAiChatContext();
  if (!error) return null;
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
      <p className="font-semibold">Er ging iets mis</p>
      <p className="mt-1 font-mono text-xs">{error.message}</p>
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
    <div className="flex flex-col gap-2">
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

function InputForm({
  placeholder = "Typ je bericht… (shift+enter voor een nieuwe regel, esc om te stoppen)",
}: { placeholder?: string }) {
  const {
    state: { inputValue },
    actions: { setInputValue, submitCurrentInput, stop, handlePaste },
    meta: { isLoading, submitBlock },
  } = useAiChatContext();

  // When a consumer has blocked submission (e.g. artefact still
  // uploading), Enter is a no-op and the submit button is disabled.
  // This runs AFTER the `isLoading` short-circuit so Stop still works
  // mid-stream even if a race puts both states true simultaneously.
  const submitBlocked = submitBlock !== null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) {
      // Cancel on submit-during-stream (e.g. user hit Enter again).
      stop();
      return;
    }
    if (submitBlocked) return;
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
    // Single visual container owns the chrome (border, focus ring via
    // focus-within). The textarea is borderless and transparent inside
    // it — no nested borders to stack as it grows. The action button is
    // absolutely positioned in the bottom-right, inside the textarea's
    // visual bounds (ChatGPT/Claude pattern). `pr-28` reserves space so
    // typed text never slides under the button.
    <form
      onSubmit={handleSubmit}
      className="relative rounded-xl border border-slate-200 bg-white shadow-sm transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
    >
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onPaste={onTextareaPaste}
        onKeyDown={(e) => {
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
            if (isLoading) {
              stop();
            } else if (submitBlocked) {
              // Swallow the Enter: the form isn't ready to submit.
              // The user sees the disabled button + tooltip as the
              // explanation. Typing continues uninterrupted.
            } else {
              submitCurrentInput();
            }
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
        className="block w-full resize-none field-sizing-content max-h-64 touch-manipulation overflow-y-auto overscroll-contain rounded-xl bg-transparent px-3 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
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
    </form>
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
