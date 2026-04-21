"use client";

import { ArrowRightIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useAiChatContext } from "~/app/_components/ai-chat";
import {
  parseKerntaakTitel,
  parseWerkprocesTitel,
} from "../../_lib/format-kerntaak";
import {
  computeProgress,
  type ProgressMap,
  type WerkprocesProgress,
} from "../_lib/progress";
import type { LeercoachRubric, LeercoachWerkproces } from "../_lib/rubric";
import {
  ScopeReferenceContext,
  type ScopeReferenceContextValue,
  useScopeReferenceContext,
} from "./scope-reference-context";

// Storyline-first rubric pane. Instead of showing the rubric as a
// flat reference tree, the pane arranges werkprocessen as the hero
// rows and layers on:
//   - A one-sentence synthesis per werkproces (fetched on mount from
//     the synthesis endpoint, which LLM-summarises the chat transcript)
//   - Presence signals (code mentioned in any turn, Concept blockquote
//     drafted) as a status dot + concept count
//   - Click-to-focus on each werkproces header: posts a scripted user
//     message that asks the coach to zoom in on that werkproces.
//     The pane stays open — it's persistent reference material,
//     parallel to the Document pane.
//
// Criteria are still available inside a per-werkproces disclosure, but
// they're secondary detail now — the werkproces synthesis is what a
// storyline-first thinker wants to scan first.
//
// Pane visibility (open/closed) is owned by ChatShell alongside
// docPaneOpen / chatPaneOpen so all three toggles share one "at least
// one pane visible" guard. This provider therefore only exposes
// `meta` — the pane component mounts/unmounts based on the parent's
// visibility state.

// ---- Provider ----

type ProviderProps = {
  rubric: LeercoachRubric;
  scopedWerkprocessen: LeercoachWerkproces[];
  chatId: string;
  children: ReactNode;
};

function Provider({
  rubric,
  scopedWerkprocessen,
  chatId,
  children,
}: ProviderProps) {
  const value = useMemo<ScopeReferenceContextValue>(
    () => ({
      meta: { rubric, scopedWerkprocessen, chatId },
    }),
    [rubric, scopedWerkprocessen, chatId],
  );

  return (
    <ScopeReferenceContext.Provider value={value}>
      {children}
    </ScopeReferenceContext.Provider>
  );
}

// ---- Pane ----

function richtingLabel(r: LeercoachRubric["richting"]): string {
  if (r === "instructeur") return "Instructeur";
  if (r === "leercoach") return "Leercoach";
  return "PvB-beoordelaar";
}

type KerntaakGroup = {
  kerntaakCode: string;
  kerntaakTitel: string;
  werkprocessen: LeercoachWerkproces[];
};

function groupByKerntaak(
  werkprocessen: LeercoachWerkproces[],
): KerntaakGroup[] {
  const byCode = new Map<string, KerntaakGroup>();
  for (const wp of werkprocessen) {
    let group = byCode.get(wp.kerntaakCode);
    if (!group) {
      group = {
        kerntaakCode: wp.kerntaakCode,
        kerntaakTitel: wp.kerntaakTitel,
        werkprocessen: [],
      };
      byCode.set(wp.kerntaakCode, group);
    }
    group.werkprocessen.push(wp);
  }
  return Array.from(byCode.values());
}

function Pane() {
  const {
    meta: { rubric, scopedWerkprocessen, chatId },
  } = useScopeReferenceContext();

  const {
    state: { messages },
    actions: { sendMessage },
    meta: { isLoading },
  } = useAiChatContext();

  const groups = useMemo(
    () => groupByKerntaak(scopedWerkprocessen),
    [scopedWerkprocessen],
  );
  const singleGroup = groups.length === 1;

  const progress = useMemo<ProgressMap>(
    () =>
      computeProgress({
        messages,
        werkprocessen: scopedWerkprocessen,
        parseCode: (titel) => ({ code: parseWerkprocesTitel(titel).code }),
      }),
    [messages, scopedWerkprocessen],
  );

  // Synthesis: fetched on mount and refreshed whenever the fingerprint
  // changes (new turn = new message id at the tail). Keyed by
  // chat id + message count + last message id so merely re-opening
  // the pane without new activity reuses the cached response.
  //
  // Loading state is DERIVED from "we have no cached entry for the
  // current fingerprint" — avoids a synchronous setState in the
  // effect body (flagged by react-hooks/set-state-in-effect) while
  // still showing a spinner on the first mount and after each turn.
  const fingerprint = (() => {
    if (scopedWerkprocessen.length === 0) return null;
    const last = messages[messages.length - 1];
    return `${chatId}:${messages.length}:${last?.id ?? "-"}`;
  })();

  const [cached, setCached] = useState<{
    fingerprint: string;
    syntheses: Record<string, string>;
  } | null>(null);
  const [syntheseError, setSyntheseError] = useState<string | null>(null);

  useEffect(() => {
    if (fingerprint === null) return;
    if (cached?.fingerprint === fingerprint) return;

    const abort = new AbortController();
    fetch(`/api/leercoach/chat/${chatId}/synthesis`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        werkprocesIds: scopedWerkprocessen.map((w) => w.id),
      }),
      signal: abort.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(
        (data: {
          syntheses: Array<{ werkprocesId: string; summary: string }>;
        }) => {
          const map: Record<string, string> = {};
          for (const row of data.syntheses ?? []) {
            map[row.werkprocesId] = row.summary;
          }
          setCached({ fingerprint, syntheses: map });
          setSyntheseError(null);
        },
      )
      .catch((err: unknown) => {
        // AbortError fires on unmount/pane-close — silent.
        if (err instanceof DOMException && err.name === "AbortError") return;
        setSyntheseError("Synthese kon niet geladen worden.");
      });

    return () => abort.abort();
  }, [fingerprint, chatId, scopedWerkprocessen, cached?.fingerprint]);

  const syntheses = cached?.syntheses ?? {};
  const syntheseStatus: "idle" | "loading" | "error" =
    fingerprint !== null && cached?.fingerprint !== fingerprint
      ? syntheseError
        ? "error"
        : "loading"
      : "idle";

  function handleFocus(wp: LeercoachWerkproces) {
    if (isLoading) return;
    const parsed = parseWerkprocesTitel(wp.titel);
    const code = parsed.code ?? String(wp.rang);
    const label = parsed.label;
    sendMessage({
      text: `Laten we inzoomen op werkproces ${code} — ${label}. Vat kort samen wat we daar tot nu toe over besproken hebben, en zeg wat er nog nodig is voor het volledige verhaal.`,
    });
    // NOTE: pane stays open after focus — it's persistent reference
    // material, parallel to the Document pane. User dismisses via the
    // toolbar Rubriek toggle.
  }

  return (
    // Inline pane. No Dialog chrome, no close button — dismissal goes
    // through the toolbar's Rubriek pane toggle (same model as Chat /
    // Document). Background is a tonal off-white so the three panes
    // read as distinct tracks: chat=white, rubriek=slate-50,
    // doc=stone-50.
    <div className="flex h-full min-h-0 flex-1 flex-col bg-slate-50/60">
      <header className="flex shrink-0 flex-col gap-0.5 border-b border-zinc-200 bg-white/60 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Rubriek</h2>
        <p className="text-xs text-slate-600">
          {rubric.profielTitel} · {richtingLabel(rubric.richting)} niveau{" "}
          {rubric.niveauRang}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain p-4">
        {groups.length === 0 ? (
          <p className="text-sm text-slate-600">Geen werkprocessen in scope.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((group) => (
              <KerntaakGroupBlock
                key={group.kerntaakCode}
                group={group}
                defaultOpen={singleGroup}
                progress={progress}
                syntheses={syntheses}
                syntheseStatus={syntheseStatus}
                onFocus={handleFocus}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KerntaakGroupBlock({
  group,
  defaultOpen,
  progress,
  syntheses,
  syntheseStatus,
  onFocus,
  isLoading,
}: {
  group: KerntaakGroup;
  defaultOpen: boolean;
  progress: ProgressMap;
  syntheses: Record<string, string>;
  syntheseStatus: "idle" | "loading" | "error";
  onFocus: (wp: LeercoachWerkproces) => void;
  isLoading: boolean;
}) {
  const { code: parsedCode, label } = parseKerntaakTitel(group.kerntaakTitel);
  const displayCode = parsedCode ?? group.kerntaakCode;

  return (
    <details
      open={defaultOpen}
      className="group/kerntaak rounded-lg border border-zinc-200 bg-white"
    >
      <summary className="flex cursor-pointer list-none items-start gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon
          aria-hidden="true"
          className="mt-0.5 size-3.5 shrink-0 text-slate-400 transition-transform duration-150 group-open/kerntaak:rotate-90"
        />
        <span className="min-w-0 flex-1">
          <span className="whitespace-nowrap">Kerntaak {displayCode}</span>
          <span className="font-normal text-slate-600"> — {label}</span>
        </span>
        <span className="shrink-0 text-xs font-normal text-slate-400">
          {group.werkprocessen.length} werkproces
          {group.werkprocessen.length === 1 ? "" : "sen"}
        </span>
      </summary>
      <div className="flex flex-col divide-y divide-zinc-100 border-t border-zinc-200">
        {group.werkprocessen.map((wp) => (
          <WerkprocesCard
            key={wp.id}
            werkproces={wp}
            kerntaakDisplayCode={displayCode}
            progress={progress.get(wp.id)}
            synthesis={syntheses[wp.id]}
            syntheseStatus={syntheseStatus}
            onFocus={() => onFocus(wp)}
            isLoading={isLoading}
          />
        ))}
      </div>
    </details>
  );
}

function WerkprocesCard({
  werkproces,
  kerntaakDisplayCode,
  progress,
  synthesis,
  syntheseStatus,
  onFocus,
  isLoading,
}: {
  werkproces: LeercoachWerkproces;
  kerntaakDisplayCode: string;
  progress: WerkprocesProgress | undefined;
  synthesis: string | undefined;
  syntheseStatus: "idle" | "loading" | "error";
  onFocus: () => void;
  isLoading: boolean;
}) {
  const parsed = parseWerkprocesTitel(werkproces.titel);
  const displayCode =
    parsed.code ?? `${kerntaakDisplayCode}.${werkproces.rang}`;
  const cleanedLabel = parsed.label;

  const conceptCount = progress?.conceptCount ?? 0;
  const mentioned = progress?.mentioned ?? false;
  const draftedCriteria = progress?.draftedCriteria ?? new Set<number>();

  const statusTone =
    conceptCount > 0
      ? { dot: "bg-emerald-500", label: "Concept geschreven" }
      : mentioned
        ? { dot: "bg-blue-500", label: "Besproken" }
        : { dot: "bg-slate-300", label: "Nog niet aangeraakt" };

  // Synthesis visual state:
  //   - loading: italic muted placeholder
  //   - error: short fallback
  //   - idle + present: slate-700
  //   - idle + absent or "Nog niet besproken": muted italic (still readable)
  const isEmptySynthesis =
    !synthesis || synthesis.trim().toLowerCase() === "nog niet besproken.";
  const synthesisClasses = isEmptySynthesis
    ? "italic text-slate-400"
    : "text-slate-700";

  return (
    <div className="flex flex-col gap-2 px-3 py-3">
      {/* Header row: status dot + code + title + concept badge + focus button.
          The focus button is the primary CTA — storyline mode works by
          the kandidaat clicking into one werkproces after another. */}
      <div className="flex items-baseline gap-2">
        <span
          aria-hidden="true"
          className={`mt-1 size-2 shrink-0 rounded-full ${statusTone.dot}`}
          title={statusTone.label}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="whitespace-nowrap font-mono text-xs tabular-nums text-slate-500">
              {displayCode}
            </span>
            <span className="text-sm font-medium text-slate-900">
              {cleanedLabel}
            </span>
            {conceptCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                {conceptCount} concept{conceptCount === 1 ? "" : "en"}
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onFocus}
          disabled={isLoading}
          title="Zoom hier in met de leercoach"
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>Zoom in</span>
          <ArrowRightIcon className="size-3" aria-hidden="true" />
        </button>
      </div>

      {/* Synthesis line — the hero. One sentence per werkproces. */}
      <p
        className={`text-xs leading-relaxed ${synthesisClasses} pl-4`}
        aria-live="polite"
      >
        {syntheseStatus === "loading" && !synthesis
          ? "Voortgang wordt samengevat…"
          : syntheseStatus === "error" && !synthesis
            ? "Synthese kon niet geladen worden."
            : synthesis || "Nog niet besproken."}
      </p>

      {/* Criteria disclosure — secondary detail. */}
      {werkproces.criteria.length > 0 || werkproces.resultaat ? (
        <details className="group/crits pl-4">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-slate-500 hover:text-slate-900 [&::-webkit-details-marker]:hidden">
            <ChevronRightIcon
              aria-hidden="true"
              className="size-3 text-slate-400 transition-transform duration-150 group-open/crits:rotate-90"
            />
            <span>
              Toon {werkproces.criteria.length} criteri
              {werkproces.criteria.length === 1 ? "um" : "a"}
              {werkproces.resultaat ? " en resultaat" : ""}
            </span>
          </summary>
          <div className="mt-2 flex flex-col gap-2 rounded-md bg-slate-50/60 p-3">
            {werkproces.resultaat ? (
              <p className="text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-700">
                  Resultaat:{" "}
                </span>
                {werkproces.resultaat}
              </p>
            ) : null}
            {werkproces.criteria.length > 0 ? (
              <ol className="list-outside list-decimal space-y-2 pl-5 text-xs leading-relaxed text-slate-700">
                {werkproces.criteria.map((c) => {
                  const drafted = draftedCriteria.has(c.rang);
                  return (
                    <li key={c.id}>
                      <div className="flex flex-col gap-1">
                        <span className="flex items-baseline gap-1.5">
                          {drafted ? (
                            <span
                              aria-hidden="true"
                              className="inline-block size-1.5 rounded-full bg-emerald-500"
                              title="Concept geschreven voor dit criterium"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="inline-block size-1.5 rounded-full bg-slate-200"
                              title="Nog geen concept"
                            />
                          )}
                          <span className="font-medium text-slate-900">
                            {c.title}
                          </span>
                        </span>
                        {c.omschrijving ? (
                          <span className="block text-slate-600">
                            {c.omschrijving}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : null}
          </div>
        </details>
      ) : null}
    </div>
  );
}

// ---- Compound export ----

export const ScopeReference = {
  Provider,
  Pane,
};
