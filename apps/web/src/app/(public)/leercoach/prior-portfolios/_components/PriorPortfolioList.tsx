"use client";

import { useState, useTransition } from "react";
import { revokePriorPortfolioAction } from "../actions";

type PriorSource = {
  sourceId: string;
  sourceIdentifier: string;
  niveauRang: number | null;
  charCount: number;
  pageCount: number | null;
  createdAt: string;
  chunkCount: number;
};

export function PriorPortfolioList({ priors }: { priors: PriorSource[] }) {
  // Empty state is handled by the parent page (PriorPortfolioDropZone
  // is shown instead when there are no uploads). This defensive branch
  // only fires if the list is rendered without a preceding gate.
  if (priors.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
        <p>Geen portfolio's geüpload.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {priors.map((p) => (
        <PriorRow key={p.sourceId} prior={p} />
      ))}
    </ul>
  );
}

function PriorRow({ prior }: { prior: PriorSource }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      try {
        await revokePriorPortfolioAction({ sourceId: prior.sourceId });
      } catch (err) {
        console.error("Failed to revoke", err);
        setConfirming(false);
      }
    });
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col">
        <span className="font-semibold text-slate-900">
          {prior.niveauRang
            ? `Niveau ${prior.niveauRang}-portfolio`
            : "PvB-portfolio"}
        </span>
        <span className="text-xs text-slate-500">
          {prior.chunkCount} fragmenten
          {prior.pageCount ? ` · ${prior.pageCount} pagina's` : ""} · geüpload{" "}
          {formatRelative(prior.createdAt)}
        </span>
      </div>
      {confirming ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {isPending ? "Verwijder…" : "Verwijder"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={isPending}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Annuleer
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
        >
          Verwijder
        </button>
      )}
    </li>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 60) return "net";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min geleden`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} uur geleden`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay} dag${diffDay === 1 ? "" : "en"} geleden`;
  return new Date(iso).toLocaleDateString("nl-NL");
}
