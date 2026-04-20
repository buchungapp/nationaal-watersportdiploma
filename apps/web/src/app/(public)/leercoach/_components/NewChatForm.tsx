"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import { createChatAction, type CreateChatInput } from "../actions";

type ProfielOption = {
  id: string;
  titel: string;
  richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
  niveauRang: number;
  kerntaken: Array<{ id: string; titel: string; rang: number }>;
};

type ScopeChoice =
  | { type: "full_profiel" }
  | { type: "kerntaak"; kerntaakCode: string }
  | { type: "kerntaken"; kerntaakCodes: string[] };

export function NewChatForm({ profielen }: { profielen: ProfielOption[] }) {
  const [profielId, setProfielId] = useState<string | null>(null);
  const [scopeChoice, setScopeChoice] = useState<ScopeChoice | null>(null);
  const [selectedKerntaken, setSelectedKerntaken] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const profiel = profielen.find((p) => p.id === profielId);

  // Q1 rule: N3 always uses full_profiel, no picker required.
  const needsScopePicker = profiel ? profiel.niveauRang >= 4 : false;

  // Effective scope: N3 is auto-set; N4/N5 follows the user's choice.
  const effectiveScope: ScopeChoice | null = (() => {
    if (!profiel) return null;
    if (!needsScopePicker) return { type: "full_profiel" };
    return scopeChoice;
  })();

  const canSubmit = profiel !== undefined && effectiveScope !== null;

  function handleSubmit() {
    if (!profiel || !effectiveScope) return;
    setError(null);
    startTransition(async () => {
      try {
        await createChatAction({
          profielId: profiel.id,
          scope: effectiveScope,
        });
        // Redirect is handled inside createChatAction via `redirect()`.
      } catch (e) {
        // redirect() throws a sentinel NEXT_REDIRECT error to signal
        // the navigation. Without unstable_rethrow, this try/catch
        // swallows it and the user sees a red "NEXT_REDIRECT" flash
        // before the redirect wins the race. unstable_rethrow is a
        // no-op for regular errors, so our error-message branch still
        // fires for real failures.
        unstable_rethrow(e);
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step 1: profiel */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
          Stap 1 · Kwalificatieprofiel
        </h2>
        <select
          value={profielId ?? ""}
          onChange={(e) => {
            setProfielId(e.target.value || null);
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

      {/* Step 2: scope (only for N4/N5) */}
      {profiel && needsScopePicker ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
            Stap 2 · Scope
          </h2>
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 cursor-pointer hover:border-blue-300">
              <input
                type="radio"
                name="scope"
                checked={scopeChoice?.type === "full_profiel"}
                onChange={() =>
                  setScopeChoice({ type: "full_profiel" })
                }
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
                name="scope"
                checked={scopeChoice?.type === "kerntaken"}
                onChange={() =>
                  setScopeChoice({ type: "kerntaken", kerntaakCodes: [] })
                }
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-slate-900">
                  Eén of meer kerntaken
                </span>
                <span className="block text-sm text-slate-600">
                  Kies de kerntaak of bundel waar jij nu aan werkt.
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
                  Dit profiel heeft nog geen kerntaken; kies "Hele profiel"
                  hierboven.
                </p>
              ) : (
                profiel.kerntaken
                  .sort((a, b) => a.rang - b.rang)
                  .map((k) => {
                    const id = String(k.rang); // kerntaak code = rang as string
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
                            // Collapse to "kerntaak" (single) vs "kerntaken" (multiple)
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
                            Kerntaak {k.rang}
                          </span>{" "}
                          <span className="text-slate-600">— {k.titel}</span>
                        </span>
                      </label>
                    );
                  })
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Submit */}
      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            !canSubmit ||
            isPending ||
            (effectiveScope?.type === "kerntaken" &&
              effectiveScope.kerntaakCodes.length === 0)
          }
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sessie starten…" : "Start sessie"}
        </button>
        <a
          href="/leercoach"
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          Annuleren
        </a>
      </div>
    </div>
  );
}
