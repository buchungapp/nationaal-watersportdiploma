"use client";

import { useState } from "react";

// Renderer for UIMessage tool parts (AI SDK v5+ shape:
// `{ type: "tool-<toolName>", toolCallId, state, input?, output? }`).
//
// Rendering rules:
//   - state in ("input-streaming" | "input-available" | "input-available-approval"):
//     show a compact "aan het werk" pill with a spinner
//   - state === "output-available": show a collapsible disclosure card
//     summarizing the result
//   - state === "output-error": show a compact error pill
//
// Exported as a dedicated component so consumer apps can wrap it with
// their own toolbar / theming later. We recognize specific tool names
// (searchBewijsExamples, etc.) for richer rendering; unknown tools fall
// through to a generic disclosure.

export type ToolPart = {
  type: string;
  toolCallId?: string;
  state:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error"
    | string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

export function isToolPart(part: unknown): part is ToolPart {
  return (
    part !== null &&
    typeof part === "object" &&
    "type" in part &&
    typeof (part as { type: unknown }).type === "string" &&
    ((part as { type: string }).type.startsWith("tool-") ||
      (part as { type: string }).type === "dynamic-tool")
  );
}

export function ToolPartRenderer({ part }: { part: ToolPart }) {
  const toolName = part.type.replace(/^tool-/, "");

  if (part.state === "input-streaming" || part.state === "input-available") {
    return <ToolBusyPill label={humanToolLabel(toolName, "busy")} />;
  }

  if (part.state === "output-error") {
    return (
      <ToolErrorPill
        label={humanToolLabel(toolName, "error")}
        detail={part.errorText ?? describeErrorOutput(part.output)}
      />
    );
  }

  if (part.state === "output-available") {
    if (toolName === "searchBewijsExamples") {
      return <SearchBewijsExamplesOutput output={part.output} />;
    }
    // Generic done-card fallback for tools we don't specifically render.
    return (
      <ToolGenericDisclosure
        label={`${humanToolLabel(toolName, "done")} — klaar`}
        input={part.input}
        output={part.output}
      />
    );
  }

  // Unknown state — log-style fallback.
  return <ToolBusyPill label={humanToolLabel(toolName, "busy")} />;
}

// ---- Per-tool renderers ----

type SearchBewijsExamplesResult =
  | {
      ok: true;
      werkprocesTitel: string;
      criteriumTitel: string;
      examples: Array<{
        content: string;
        wordCount: number;
        concretenessScore: number | null;
        sourceRef: string;
      }>;
    }
  | { ok: false; reason: string };

function SearchBewijsExamplesOutput({ output }: { output: unknown }) {
  const parsed = parseSearchBewijsExamplesOutput(output);
  if (!parsed) {
    return (
      <ToolGenericDisclosure
        label="searchBewijsExamples — klaar"
        input={undefined}
        output={output}
      />
    );
  }
  if (!parsed.ok) {
    return (
      <ToolErrorPill
        label="Geen voorbeelden gevonden"
        detail={parsed.reason}
      />
    );
  }

  // Non-expandable metadata pill — deliberately does NOT surface the
  // example content. These fragments come from other kandidaten's
  // anonymised portfolios (the seed corpus); the system prompt tells
  // the model to paraphrase in its own words instead of citing them
  // verbatim. Letting the user click-to-expand and read the source
  // text defeats that rule — they'd just copy it. The model still
  // sees the full content in its tool result; the user sees only
  // that a lookup happened + which criterium.
  return (
    <div className="my-1 inline-flex max-w-[85%] flex-wrap items-baseline gap-x-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
      <span className="font-semibold">
        {parsed.examples.length} voorbeeld
        {parsed.examples.length === 1 ? "" : "en"}
      </span>
      <span>opgehaald voor</span>
      <span className="italic text-slate-600">{parsed.criteriumTitel}</span>
    </div>
  );
}

function parseSearchBewijsExamplesOutput(
  output: unknown,
): SearchBewijsExamplesResult | null {
  if (output === null || typeof output !== "object") return null;
  const o = output as Record<string, unknown>;
  if (o.ok === false && typeof o.reason === "string") {
    return { ok: false, reason: o.reason };
  }
  if (
    o.ok === true &&
    typeof o.werkprocesTitel === "string" &&
    typeof o.criteriumTitel === "string" &&
    Array.isArray(o.examples)
  ) {
    return {
      ok: true,
      werkprocesTitel: o.werkprocesTitel,
      criteriumTitel: o.criteriumTitel,
      examples: (o.examples as unknown[])
        .filter(
          (e): e is { content: string; wordCount: number; concretenessScore: number | null; sourceRef: string } =>
            e !== null &&
            typeof e === "object" &&
            typeof (e as { content: unknown }).content === "string",
        )
        .map((e) => ({
          content: String(e.content),
          wordCount: Number(e.wordCount) || 0,
          concretenessScore:
            typeof e.concretenessScore === "number"
              ? e.concretenessScore
              : null,
          sourceRef: String(e.sourceRef),
        })),
    };
  }
  return null;
}

// ---- Shared pill/card primitives ----

function ToolBusyPill({ label }: { label: string }) {
  return (
    <div className="my-1 inline-flex max-w-[85%] items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-900">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

function ToolErrorPill({
  label,
  detail,
}: { label: string; detail: string }) {
  return (
    <div className="my-1 inline-flex max-w-[85%] flex-col gap-0.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
      <span className="font-semibold">{label}</span>
      <span className="text-amber-800">{detail}</span>
    </div>
  );
}

function ToolGenericDisclosure({
  label,
  input,
  output,
}: {
  label: string;
  input: unknown;
  output: unknown;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-1 max-w-[85%] rounded-lg border border-slate-200 bg-white text-xs shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
      >
        <span>{label}</span>
        <span
          className="text-slate-400"
          style={{ transform: open ? "rotate(90deg)" : "none" }}
        >
          ›
        </span>
      </button>
      {open ? (
        <div className="flex flex-col gap-2 border-t border-slate-200 px-3 py-2 font-mono text-[11px] text-slate-700">
          {input !== undefined ? (
            <div>
              <p className="font-sans text-slate-500">input</p>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          ) : null}
          {output !== undefined ? (
            <div>
              <p className="font-sans text-slate-500">output</p>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700"
      aria-hidden="true"
    />
  );
}

function humanToolLabel(
  toolName: string,
  phase: "busy" | "done" | "error",
): string {
  const labels: Record<string, { busy: string; done: string; error: string }> =
    {
      searchBewijsExamples: {
        busy: "Zoekt voorbeelden in geslaagde portfolio's…",
        done: "Voorbeelden opgehaald",
        error: "Voorbeelden ophalen mislukt",
      },
    };
  const match = labels[toolName];
  if (match) return match[phase];
  // Fallback: humanize the camelCase tool name.
  const human = toolName.replace(/([A-Z])/g, " $1").toLowerCase().trim();
  return phase === "busy"
    ? `Voert ${human} uit…`
    : phase === "error"
      ? `${human} — mislukt`
      : `${human} — klaar`;
}

function describeErrorOutput(output: unknown): string {
  if (output === null || typeof output !== "object") return "onbekende fout";
  const o = output as Record<string, unknown>;
  if (typeof o.reason === "string") return o.reason;
  return "onbekende fout";
}
