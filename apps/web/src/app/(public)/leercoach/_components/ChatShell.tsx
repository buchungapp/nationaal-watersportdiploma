"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Track whether the user has intentionally scrolled up. If they have, we
  // do NOT hijack their scroll when new tokens stream in — reading older
  // messages shouldn't yank you back to the bottom on every chunk.
  const stickToBottomRef = useRef(true);

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

  // Watch the chat-container's scroll position. Within 80px of the bottom is
  // "at the bottom" and future updates auto-scroll. If the user scrolls up
  // further, we release the sticky behaviour until they scroll back.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current = distanceFromBottom < 80;
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // On every message update, scroll the INNER container to bottom — never
  // the page. Previously this used messagesEndRef.scrollIntoView, which
  // bubbles up and scrolls the nearest overflow ancestor (the document on
  // large screens), pushing the chat header out of view with every token.
  // useLayoutEffect so the scroll happens before paint and there's no flash.
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (!stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || status === "streaming" || status === "submitted") return;
    sendMessage({ text });
    setInputValue("");
  }

  const isLoading = status === "streaming" || status === "submitted";

  // Starter suggestions: only show when the conversation hasn't really
  // started yet (just the leercoach's opening message, no user turns).
  // Three concrete starter prompts matching the options laid out in the
  // opening message — keeps the kandidaat moving if they don't know
  // what to type.
  const userTurnCount = messages.filter((m) => m.role === "user").length;
  const showStarters = userTurnCount === 0;

  function handleStarter(text: string) {
    if (isLoading) return;
    sendMessage({ text });
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4"
      >
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
            {STARTER_SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                disabled={isLoading}
                onClick={() => handleStarter(s.prompt)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
          </div>
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

// Four starter chips matching the archetypes in the opening message.
// The key distinction the product owner flagged: "eerdere portfolio's
// voor lager niveau" is a different starting point than "materiaal voor
// dit portfolio" — collapsing them confuses N4/N5 kandidaten who have
// N3 PvB's but haven't written anything new yet.
//
// Each chip sends a full first-person prompt straight into the chat so
// the leercoach knows exactly where the kandidaat is and can respond
// appropriately without another round of "waar begin je?".
const STARTER_SUGGESTIONS: Array<{ label: string; prompt: string }> = [
  {
    label: "Leg me uit wat dit portfolio moet zijn",
    prompt:
      "Kun je me eerst uitleggen wat dit portfolio moet zijn? Hoe is het opgebouwd, wat zoekt een beoordelaar, en waar werk ik uiteindelijk naartoe? Ik wil overzicht voor we aan de slag gaan.",
  },
  {
    label: "Ik heb eerdere PvB-portfolio's geschreven",
    prompt:
      "Ik heb voor een lager niveau al een PvB-portfolio geschreven. Voor dit portfolio heb ik nog niks nieuws op papier, maar ik wil niet alles opnieuw doen. Hoe kunnen we daarop voortbouwen?",
  },
  {
    label: "Ik heb aantekeningen voor dit portfolio",
    prompt:
      "Ik heb al aantekeningen of wat tekst voor dit specifieke portfolio liggen. Kun je me helpen om dat materiaal bij elkaar te brengen? Ik kan het zo delen zodra je klaar bent.",
  },
  {
    label: "Ik begin helemaal blanco",
    prompt:
      "Ik begin helemaal blanco. Geen eerdere portfolio's, geen aantekeningen, we starten vanaf nul. Waar zullen we starten? Stel gerust eerst een paar vragen om erachter te komen wat ik al heb meegemaakt in mijn praktijk.",
  },
];

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
            <SimpleMarkdown
              key={`text-${i}-${(part as { text: string }).text.slice(0, 20)}`}
              text={(part as { text: string }).text}
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

// Minimal safe markdown renderer — handles only the primitives our
// templates + the LLM actually use. No HTML parsing, no deps, no XSS
// surface; everything lands in React elements, not dangerouslySetInnerHTML.
//
// Supported: **bold**, paragraphs separated by blank lines, `- item`
// bullet lists, and `1. item` numbered lists. Anything else renders as
// preserved-whitespace plain text inside a <p>.
function SimpleMarkdown({ text }: { text: string }) {
  const blocks = splitIntoBlocks(text);
  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, i) => {
        if (block.kind === "ul") {
          return (
            <ul key={`ul-${i}`} className="ml-5 list-disc space-y-1">
              {block.items.map((item, j) => (
                <li key={`ul-${i}-li-${j}`}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        if (block.kind === "ol") {
          return (
            <ol key={`ol-${i}`} className="ml-5 list-decimal space-y-1">
              {block.items.map((item, j) => (
                <li key={`ol-${i}-li-${j}`}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={`p-${i}`} className="whitespace-pre-wrap">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

type Block =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

function splitIntoBlocks(text: string): Block[] {
  const paragraphs = text.split(/\n\s*\n/);
  const blocks: Block[] = [];
  for (const para of paragraphs) {
    const lines = para.split("\n");
    const isBullet = lines.every((l) => /^\s*-\s+/.test(l) || l.trim() === "");
    const isNumber = lines.every(
      (l) => /^\s*\d+\.\s+/.test(l) || l.trim() === "",
    );
    if (isBullet && lines.some((l) => l.trim() !== "")) {
      blocks.push({
        kind: "ul",
        items: lines
          .filter((l) => l.trim() !== "")
          .map((l) => l.replace(/^\s*-\s+/, "")),
      });
    } else if (isNumber && lines.some((l) => l.trim() !== "")) {
      blocks.push({
        kind: "ol",
        items: lines
          .filter((l) => l.trim() !== "")
          .map((l) => l.replace(/^\s*\d+\.\s+/, "")),
      });
    } else {
      blocks.push({ kind: "p", text: para });
    }
  }
  return blocks;
}

// Replace **bold** with React <strong> nodes while leaving everything else
// as plain text. Splits on the regex so we never dangerouslySetInnerHTML.
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const match = /^\*\*([^*]+)\*\*$/.exec(part);
    if (match?.[1]) {
      return <strong key={`b-${i}`}>{match[1]}</strong>;
    }
    return <span key={`t-${i}`}>{part}</span>;
  });
}
