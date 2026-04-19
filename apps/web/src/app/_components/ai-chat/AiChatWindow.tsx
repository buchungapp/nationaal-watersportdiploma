"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useState } from "react";
import { SimpleMarkdown } from "./markdown";
import { isToolPart, type ToolPart, ToolPartRenderer } from "./tool-parts";
import type {
  AiChatInitialMessage,
  AiChatStarter,
  AiChatWindowProps,
} from "./types";
import { useStickyScroll } from "./use-sticky-scroll";

// Reusable AI chat window. Consumers provide the streaming endpoint, the
// initial messages (usually loaded from DB server-side), and optional
// customizations for placeholder / starters / empty state. The component
// handles:
//   - useChat wiring to the endpoint
//   - message rendering with SimpleMarkdown
//   - starter chips (visible until the first user turn)
//   - input textarea with Enter-to-send + Shift+Enter for newline
//   - container-bounded scrolling that doesn't hijack the page
//   - default error surface (optional onError callback for consumer toast)
//
// Used by /leercoach today. Future surfaces (portfolio-checker chat,
// portfolio-review reviewer chat) consume the same component, with
// different apiEndpoint + starters + emptyState.
export function AiChatWindow({
  chatId,
  initialMessages,
  apiEndpoint,
  placeholder = "Typ je bericht… (shift+enter voor een nieuwe regel)",
  starters,
  emptyState,
  slotAboveInput,
  onError,
  className,
}: AiChatWindowProps) {
  const [inputValue, setInputValue] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    id: chatId,
    messages: initialMessages as UIMessage[],
    transport: new DefaultChatTransport({
      api: apiEndpoint,
      prepareSendMessagesRequest: ({ messages: msgs, id }) => ({
        body: { id, messages: msgs },
      }),
    }),
  });

  // Forward streaming errors to the consumer's callback. The built-in error
  // box renders regardless, but consumers typically want a toast too.
  useEffect(() => {
    if (error && onError) onError(error);
  }, [error, onError]);

  const scrollContainerRef = useStickyScroll<HTMLDivElement>(messages);

  const isLoading = status === "streaming" || status === "submitted";

  const userTurnCount = messages.filter((m) => m.role === "user").length;
  const showStarters =
    userTurnCount === 0 && starters !== undefined && starters.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInputValue("");
  }

  function handleStarter(starter: AiChatStarter) {
    if (isLoading) return;
    sendMessage({ text: starter.prompt });
  }

  return (
    <div
      className={`flex flex-1 flex-col gap-4 overflow-hidden${className ? ` ${className}` : ""}`}
    >
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4"
      >
        {messages.length === 0 ? (
          emptyState ?? <DefaultEmptyState />
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
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  <RenderMessageParts parts={m.parts} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          <p className="font-semibold">Er ging iets mis</p>
          <p className="mt-1 font-mono text-xs">{error.message}</p>
        </div>
      ) : null}

      {showStarters ? (
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
                onClick={() => handleStarter(s)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {slotAboveInput
        ? slotAboveInput({
            sendMessage: (input) => sendMessage(input),
            isLoading,
          })
        : null}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2"
      >
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={placeholder}
          rows={2}
          disabled={isLoading}
          className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "…" : "Verstuur"}
        </button>
      </form>
    </div>
  );
}

function DefaultEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-600">
      <p className="font-semibold text-slate-900">
        Klaar om te beginnen.
      </p>
      <p>Stel een vraag of beschrijf waar je aan wilt werken.</p>
    </div>
  );
}

// Render UIMessage parts. Text parts go through SimpleMarkdown (streamdown);
// tool parts (AI SDK v5+ shape: type="tool-<name>", state, input, output)
// get rendered by ToolPartRenderer with per-tool disclosure UI. Anything
// we don't recognize falls through to a JSON <pre> for debug visibility.
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

// Re-export helper function for consumers that want to classify parts
// themselves.
export { isTextPart };

// Re-export types for convenience so consumers don't need to import from
// two files.
export type { AiChatInitialMessage, AiChatStarter, AiChatWindowProps };
