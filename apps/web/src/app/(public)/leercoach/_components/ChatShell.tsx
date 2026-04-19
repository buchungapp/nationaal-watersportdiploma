"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";

type Props = {
  chatId: string;
  initialMessages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    parts: unknown[];
  }>;
};

// Client chat shell — wraps the AI SDK's useChat hook against our
// /api/leercoach/chat endpoint. v1 is intentionally minimal: text messages
// only, streamed, saved server-side. Tool calls, artifacts, and resumable
// streams come in later phases.
export function ChatShell({ chatId, initialMessages }: Props) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    id: chatId,
    messages: initialMessages as UIMessage[],
    transport: new DefaultChatTransport({
      api: "/api/leercoach/chat",
      prepareSendMessagesRequest: ({ messages: msgs, id }) => ({
        body: {
          id,
          messages: msgs,
        },
      }),
    }),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || status === "streaming" || status === "submitted") return;
    sendMessage({ text });
    setInputValue("");
  }

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">
              Welkom bij je leercoach.
            </p>
            <p>Stel een vraag of beschrijf waar je aan wilt werken.</p>
          </div>
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
                  <RenderParts parts={m.parts} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          <p className="font-semibold">Er ging iets mis</p>
          <p className="mt-1 font-mono text-xs">{error.message}</p>
        </div>
      ) : null}

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
          placeholder="Typ je bericht… (shift+enter voor een nieuwe regel)"
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

// Render UIMessage parts. v1 handles text only; other part types (tool-call,
// tool-result, source, etc.) fall through to JSON for debugging until we
// wire proper renderers in later phases.
function RenderParts({ parts }: { parts: unknown }) {
  if (!Array.isArray(parts)) return null;
  return (
    <>
      {parts.map((part, i) => {
        if (
          part &&
          typeof part === "object" &&
          "type" in part &&
          (part as { type: unknown }).type === "text" &&
          "text" in part &&
          typeof (part as { text: unknown }).text === "string"
        ) {
          return (
            <p
              key={`text-${i}-${(part as { text: string }).text.slice(0, 20)}`}
              className="whitespace-pre-wrap"
            >
              {(part as { text: string }).text}
            </p>
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
