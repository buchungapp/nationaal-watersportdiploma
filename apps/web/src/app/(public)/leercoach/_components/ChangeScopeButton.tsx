"use client";

import { useState, useTransition } from "react";
import { updateChatScopeAction } from "../actions";

type Kerntaak = {
  id: string;
  titel: string;
  rang: number;
};

type CurrentScope =
  | { type: "full_profiel" }
  | { type: "kerntaak"; kerntaakCode: string }
  | { type: "kerntaken"; kerntaakCodes: string[] };

type Props = {
  chatId: string;
  niveauRang: number;
  kerntaken: Kerntaak[];
  currentScope: CurrentScope;
};

// Header button that opens an inline picker for switching the chat's scope
// mid-session. Q1 rule still applies:
//   - N3 always works on full_profiel → button is hidden entirely.
//   - N4/N5 can switch between full_profiel / kerntaak / kerntaken.
//
// The picker is inline (not a modal) so it feels like part of the
// conversation rather than a separate flow. Submission calls
// updateChatScopeAction, which saves an informational assistant message
// explaining the shift — so the conversation stays coherent.
export function ChangeScopeButton({
  chatId,
  niveauRang,
  kerntaken,
  currentScope,
}: Props) {
  const [open, setOpen] = useState(false);
  const [nextScope, setNextScope] = useState<CurrentScope>(currentScope);
  const [selectedKerntaken, setSelectedKerntaken] = useState<string[]>(
    currentScope.type === "kerntaak"
      ? [currentScope.kerntaakCode]
      : currentScope.type === "kerntaken"
        ? currentScope.kerntaakCodes
        : [],
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // N3 never needs scope changes per Q1.
  if (niveauRang < 4) return null;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await updateChatScopeAction({ chatId, scope: nextScope });
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  function toggleKerntaak(code: string) {
    const next = selectedKerntaken.includes(code)
      ? selectedKerntaken.filter((c) => c !== code)
      : [...selectedKerntaken, code];
    setSelectedKerntaken(next);
    if (next.length === 1) {
      setNextScope({ type: "kerntaak", kerntaakCode: next[0]! });
    } else if (next.length > 1) {
      setNextScope({ type: "kerntaken", kerntaakCodes: next });
    } else {
      setNextScope({ type: "kerntaken", kerntaakCodes: [] });
    }
  }

  const scopeValid =
    nextScope.type !== "kerntaken" || nextScope.kerntaakCodes.length >= 1;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
      >
        Scope wijzigen
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-slate-900">
          Scope wijzigen
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-500 hover:text-slate-900"
        >
          Sluiten
        </button>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="radio"
          name="scope-change"
          checked={nextScope.type === "full_profiel"}
          onChange={() => {
            setNextScope({ type: "full_profiel" });
            setSelectedKerntaken([]);
          }}
          className="mt-1"
        />
        <span className="text-sm">
          <span className="block font-medium text-slate-900">Hele profiel</span>
          <span className="block text-xs text-slate-600">
            Alle werkprocessen van dit profiel.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="radio"
          name="scope-change"
          checked={
            nextScope.type === "kerntaak" || nextScope.type === "kerntaken"
          }
          onChange={() =>
            setNextScope({
              type: "kerntaken",
              kerntaakCodes: selectedKerntaken,
            })
          }
          className="mt-1"
        />
        <span className="text-sm">
          <span className="block font-medium text-slate-900">
            Specifieke kerntaak (of bundel)
          </span>
          <span className="block text-xs text-slate-600">
            Kies één of meer kerntaken waar je op wilt focussen.
          </span>
        </span>
      </label>

      {(nextScope.type === "kerntaak" || nextScope.type === "kerntaken") && (
        <div className="ml-6 flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
          {kerntaken.length === 0 ? (
            <p className="text-xs text-slate-600">
              Dit profiel heeft geen kerntaken.
            </p>
          ) : (
            kerntaken
              .slice()
              .sort((a, b) => a.rang - b.rang)
              .map((k) => {
                const code = String(k.rang);
                const checked = selectedKerntaken.includes(code);
                return (
                  <label
                    key={k.id}
                    className="flex items-start gap-2 text-xs text-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleKerntaak(code)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="font-medium">Kerntaak {k.rang}</span> —{" "}
                      {k.titel}
                    </span>
                  </label>
                );
              })
          )}
        </div>
      )}

      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 p-2 text-xs text-red-900">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Annuleer
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!scopeValid || isPending}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Opslaan…" : "Opslaan"}
        </button>
      </div>
    </div>
  );
}
