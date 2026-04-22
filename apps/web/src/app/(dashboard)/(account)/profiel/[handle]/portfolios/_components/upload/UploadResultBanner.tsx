"use client";

// Stateless banner for the upload lifecycle. Split from the dialog so
// consumers that embed the upload form inline (no dialog) can render
// the same result treatment without duplicating markup.
//
// Four states → four visual treatments:
//   - idle                  → render nothing (caller shows the form)
//   - pending | processing  → blue "verwerken..." with animated spinner
//   - ready                 → green success banner
//   - failed                → red error banner with the reason

import { ArrowPathIcon } from "@heroicons/react/20/solid";
import type { UploadState } from "./useUploadPortfolioForm";

type Props = {
  state: UploadState;
};

export function UploadResultBanner({ state }: Props) {
  if (state.kind === "idle") return null;

  if (state.kind === "pending" || state.kind === "processing") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900">
        <ArrowPathIcon
          aria-hidden="true"
          className="size-4 shrink-0 animate-spin"
        />
        <p>
          <span className="font-semibold">Verwerken…</span>{" "}
          {state.kind === "pending"
            ? "Upload ontvangen, anonimisering gestart."
            : "We anonimiseren je portfolio. Dit kan een minuut duren."}
        </p>
      </div>
    );
  }

  if (state.kind === "ready") {
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900">
        <p className="font-semibold">Klaar.</p>
        <p className="mt-0.5 text-green-800">
          Je portfolio is geanonimiseerd en opgeslagen. Je originele bestand
          blijft beschikbaar onder je account.
        </p>
      </div>
    );
  }

  if (state.kind === "failed") {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
        <p>
          <span className="font-semibold">Mislukt:</span> {state.errorMessage}
        </p>
      </div>
    );
  }

  // Exhaustiveness — every UploadState branch handled above.
  return null;
}
