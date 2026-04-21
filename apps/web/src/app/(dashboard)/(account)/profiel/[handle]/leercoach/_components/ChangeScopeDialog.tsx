"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import { parseKerntaakTitel } from "../../_lib/format-kerntaak";
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
  open: boolean;
  onClose: () => void;
  handle: string;
  chatId: string;
  niveauRang: number;
  kerntaken: Kerntaak[];
  currentScope: CurrentScope;
};

// Controlled dialog for switching a chat's scope mid-session. Q1 rule:
//   - N3 never changes scope (always full_profiel) → parent simply
//     doesn't render this dialog on N3 chats.
//   - N4/N5 can switch between full_profiel | kerntaak | kerntaken.
//
// Used to be an inline expanding panel living in the page header. Now
// a modal so it can be triggered from the chat toolbar's actions menu
// without fighting the toolbar for space.
export function ChangeScopeDialog({
  open,
  onClose,
  handle,
  chatId,
  niveauRang,
  kerntaken,
  currentScope,
}: Props) {
  // N3 never needs scope changes per Q1 — parent already gates on this
  // but be defensive so a stray render doesn't flash an empty dialog.
  if (niveauRang < 4) return null;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-slate-900/40 transition duration-200 ease-out data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="flex w-full max-w-lg flex-col gap-4 rounded-xl bg-white p-5 shadow-xl transition duration-200 ease-out data-closed:scale-95 data-closed:opacity-0"
        >
          {/* Form keyed on `open` so it remounts each time the dialog
              is shown — useState initializers re-read from
              currentScope, giving the user a clean slate after
              cancel/reopen cycles WITHOUT a setState-in-effect
              (flagged by react-hooks/set-state-in-effect). */}
          {open ? (
            <ChangeScopeForm
              key={stableScopeKey(currentScope)}
              onClose={onClose}
              handle={handle}
              chatId={chatId}
              kerntaken={kerntaken}
              currentScope={currentScope}
            />
          ) : null}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// Stable identity for the currentScope value so the form remount only
// happens when scope actually differs — not on every render pass.
function stableScopeKey(scope: CurrentScope): string {
  if (scope.type === "full_profiel") return "full";
  if (scope.type === "kerntaak") return `kt:${scope.kerntaakCode}`;
  return `kts:${[...scope.kerntaakCodes].sort().join(",")}`;
}

function ChangeScopeForm({
  onClose,
  handle,
  chatId,
  kerntaken,
  currentScope,
}: {
  onClose: () => void;
  handle: string;
  chatId: string;
  kerntaken: Kerntaak[];
  currentScope: CurrentScope;
}) {
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

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await updateChatScopeAction({ chatId, scope: nextScope, handle });
        onClose();
      } catch (e) {
        // unstable_rethrow lets Next.js redirect/notFound sentinels
        // propagate correctly. No-op for regular errors.
        unstable_rethrow(e);
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

  return (
    <>
      <header className="flex items-start justify-between gap-3">
        <DialogTitle className="text-base font-semibold text-slate-900">
          Scope wijzigen
        </DialogTitle>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          aria-label="Sluiten"
          className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
        >
          <XMarkIcon className="size-5" aria-hidden="true" />
        </button>
      </header>

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
                const { code: displayCode, label } = parseKerntaakTitel(
                  k.titel,
                );
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
                      <span className="font-medium">
                        {displayCode ? `Kerntaak ${displayCode}` : "Kerntaak"}
                      </span>{" "}
                      — {label}
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
          onClick={onClose}
          disabled={isPending}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
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
    </>
  );
}
