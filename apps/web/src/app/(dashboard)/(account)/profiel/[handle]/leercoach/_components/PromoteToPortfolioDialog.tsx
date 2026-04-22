"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { unstable_rethrow } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { parseKerntaakTitel } from "../../_lib/format-kerntaak";
import { promoteChatAction } from "../actions";

// One-way promotion dialog for a vraag-sessie → portfolio-sessie.
// Collects the same profiel + scope that NewChatForm does (Q1 rule:
// N3 auto-scopes to full_profiel; N4/N5 pick). On submit we call
// promoteChatAction, which resolve-or-creates the portfolio and
// atomically binds the chat; on success we refresh the page so the
// chat surface re-renders with Rubriek + Document panes visible.

type Richting = "instructeur" | "leercoach" | "pvb_beoordelaar";

type ProfielOption = {
  id: string;
  titel: string;
  richting: Richting;
  niveauRang: number;
  kerntaken: Array<{ id: string; titel: string; rang: number }>;
};

type InstructieGroepOption = {
  id: string;
  title: string;
  richting: Richting;
};

type ScopeChoice =
  | { type: "full_profiel" }
  | { type: "kerntaak"; kerntaakCode: string }
  | { type: "kerntaken"; kerntaakCodes: string[] };

type Props = {
  open: boolean;
  onClose: () => void;
  handle: string;
  chatId: string;
  profielen: ProfielOption[];
  instructieGroepen: InstructieGroepOption[];
};

export function PromoteToPortfolioDialog({
  open,
  onClose,
  handle,
  chatId,
  profielen,
  instructieGroepen,
}: Props) {
  const [profielId, setProfielId] = useState<string | null>(null);
  const [instructieGroepId, setInstructieGroepId] = useState<string | null>(
    null,
  );
  const [scopeChoice, setScopeChoice] = useState<ScopeChoice | null>(null);
  const [selectedKerntaken, setSelectedKerntaken] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const profiel = profielen.find((p) => p.id === profielId);
  const needsScopePicker = profiel ? profiel.niveauRang >= 4 : false;
  const needsInstructieGroep = profiel?.richting === "instructeur";
  const availableInstructieGroepen = useMemo(
    () =>
      profiel
        ? instructieGroepen.filter((g) => g.richting === profiel.richting)
        : [],
    [profiel, instructieGroepen],
  );
  const effectiveScope: ScopeChoice | null = (() => {
    if (!profiel) return null;
    if (!needsScopePicker) return { type: "full_profiel" };
    return scopeChoice;
  })();

  const canSubmit =
    profiel !== undefined &&
    effectiveScope !== null &&
    (effectiveScope.type !== "kerntaken" ||
      effectiveScope.kerntaakCodes.length > 0) &&
    (!needsInstructieGroep || instructieGroepId !== null);

  function handleSubmit() {
    if (!profiel || !effectiveScope) return;
    setError(null);
    startTransition(async () => {
      try {
        await promoteChatAction({
          chatId,
          handle,
          profielId: profiel.id,
          scope: effectiveScope,
          instructieGroepId: needsInstructieGroep ? instructieGroepId : null,
        });
        onClose();
      } catch (e) {
        unstable_rethrow(e);
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  function reset() {
    setProfielId(null);
    setInstructieGroepId(null);
    setScopeChoice(null);
    setSelectedKerntaken([]);
    setError(null);
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (isPending) return;
        reset();
        onClose();
      }}
      className="relative z-50"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-slate-900/30 transition duration-200 ease-out data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-xl transition duration-200 ease-out data-closed:scale-95 data-closed:opacity-0"
        >
          <header className="flex flex-col gap-1 border-b border-zinc-200 p-5">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Koppel aan portfolio
            </DialogTitle>
            <p className="text-sm text-slate-600">
              Vanaf de volgende beurt werkt je leercoach gericht aan dit
              portfolio. Je eerdere vragen blijven staan als context.
            </p>
          </header>

          <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5">
            {/* Step 1: profiel */}
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                Stap 1 · Kwalificatieprofiel
              </h3>
              <select
                value={profielId ?? ""}
                onChange={(e) => {
                  setProfielId(e.target.value || null);
                  setInstructieGroepId(null);
                  setScopeChoice(null);
                  setSelectedKerntaken([]);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Kies een profiel…</option>
                {profielen.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titel} (niveau {p.niveauRang})
                  </option>
                ))}
              </select>
            </section>

            {/* Instructiegroep picker (richting=instructeur only). Same
                identity role as in NewChatForm — picks which of "Instructeur
                5 — Jeugdzeilen" vs "— Jachtvaren" this chat joins. */}
            {profiel && needsInstructieGroep ? (
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                  Stap 2 · Instructiegroep
                </h3>
                {availableInstructieGroepen.length === 0 ? (
                  <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                    Geen instructiegroepen beschikbaar voor dit profiel.
                  </p>
                ) : (
                  <select
                    value={instructieGroepId ?? ""}
                    onChange={(e) =>
                      setInstructieGroepId(e.target.value || null)
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Kies een instructiegroep…</option>
                    {availableInstructieGroepen.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                )}
              </section>
            ) : null}

            {/* Step 2/3: scope (N4/N5 only) */}
            {profiel && needsScopePicker ? (
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                  {needsInstructieGroep ? "Stap 3 · Scope" : "Stap 2 · Scope"}
                </h3>
                <div className="flex flex-col gap-2">
                  <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 cursor-pointer hover:border-blue-300">
                    <input
                      type="radio"
                      name="promote-scope"
                      checked={scopeChoice?.type === "full_profiel"}
                      onChange={() => setScopeChoice({ type: "full_profiel" })}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold text-slate-900">
                        Hele profiel
                      </span>
                      <span className="block text-sm text-slate-600">
                        Alle werkprocessen van dit profiel.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 cursor-pointer hover:border-blue-300">
                    <input
                      type="radio"
                      name="promote-scope"
                      checked={scopeChoice?.type === "kerntaken"}
                      onChange={() =>
                        setScopeChoice({
                          type: "kerntaken",
                          kerntaakCodes: [],
                        })
                      }
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold text-slate-900">
                        Eén of meer kerntaken
                      </span>
                      <span className="block text-sm text-slate-600">
                        Kies de kerntaak of bundel waar je aan gaat werken.
                      </span>
                    </span>
                  </label>
                </div>

                {scopeChoice?.type === "kerntaken" ? (
                  <div className="ml-6 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Kies kerntaken
                    </p>
                    {profiel.kerntaken.length === 0 ? (
                      <p className="text-sm text-slate-600">
                        Dit profiel heeft nog geen kerntaken; kies &ldquo;Hele
                        profiel&rdquo; hierboven.
                      </p>
                    ) : (
                      profiel.kerntaken
                        .sort((a, b) => a.rang - b.rang)
                        .map((k) => {
                          const id = String(k.rang);
                          const { code: displayCode, label } =
                            parseKerntaakTitel(k.titel);
                          const checked = selectedKerntaken.includes(id);
                          return (
                            <label
                              key={k.id}
                              className="flex items-start gap-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...selectedKerntaken, id]
                                    : selectedKerntaken.filter((c) => c !== id);
                                  setSelectedKerntaken(next);
                                  if (next.length === 1) {
                                    setScopeChoice({
                                      type: "kerntaak",
                                      kerntaakCode: next[0]!,
                                    });
                                  } else if (next.length > 1) {
                                    setScopeChoice({
                                      type: "kerntaken",
                                      kerntaakCodes: next,
                                    });
                                  } else {
                                    setScopeChoice({
                                      type: "kerntaken",
                                      kerntaakCodes: [],
                                    });
                                  }
                                }}
                                className="mt-1"
                              />
                              <span>
                                <span className="font-medium text-slate-900">
                                  {displayCode
                                    ? `Kerntaak ${displayCode}`
                                    : "Kerntaak"}
                                </span>{" "}
                                <span className="text-slate-600">
                                  — {label}
                                </span>
                              </span>
                            </label>
                          );
                        })
                    )}
                  </div>
                ) : null}
              </section>
            ) : null}

            {error ? (
              <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-200 p-4">
            <button
              type="button"
              onClick={() => {
                if (isPending) return;
                reset();
                onClose();
              }}
              disabled={isPending}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              Annuleer
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Koppelen…" : "Koppel"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
