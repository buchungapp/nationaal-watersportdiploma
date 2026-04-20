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
import { DefaultChatTransport, type UIMessage } from "ai";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  AiChatContext,
  type AiChatContextValue,
  type AiChatMessage,
  useAiChatContext,
} from "./context";
import { SimpleMarkdown } from "./markdown";
import { isToolPart, type ToolPart, ToolPartRenderer } from "./tool-parts";
import type { AiChatInitialMessage, AiChatStarter } from "./types";
import { useStickyScroll } from "./use-sticky-scroll";

// ---- Provider ----

type ProviderProps = {
  chatId: string;
  initialMessages: AiChatInitialMessage[];
  apiEndpoint: string;
  starters?: AiChatStarter[];
  onError?: (error: Error) => void;
  children: ReactNode;
};

function Provider({
  chatId,
  initialMessages,
  apiEndpoint,
  starters = [],
  onError,
  children,
}: ProviderProps) {
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
    },
    meta: {
      isLoading,
      scrollContainerRef,
    },
  };

  return <AiChatContext value={value}>{children}</AiChatContext>;
}

// ---- Frame ----

function Frame({
  children,
  className,
}: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex flex-1 flex-col gap-4 overflow-hidden${className ? ` ${className}` : ""}`}
    >
      {children}
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
      className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4"
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

function InputForm({
  placeholder = "Typ je bericht… (shift+enter voor een nieuwe regel)",
}: { placeholder?: string }) {
  const {
    state: { inputValue },
    actions: { setInputValue, submitCurrentInput },
    meta: { isLoading },
  } = useAiChatContext();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitCurrentInput();
  }

  return (
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
            submitCurrentInput();
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
