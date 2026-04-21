"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import { parseKerntaakTitel } from "../../_lib/format-kerntaak";
import { revokePortfolioAction } from "../actions";
import type { ProfielOption } from "./upload/useUploadPortfolioForm";

type PortfolioRichting = "instructeur" | "leercoach" | "pvb_beoordelaar";

type CoverageScope =
  | { type: "full_profiel" }
  | { type: "kerntaken"; kerntaakCodes: string[] };

type PriorSource = {
  sourceId: string;
  sourceIdentifier: string;
  profielId: string | null;
  richting: PortfolioRichting | null;
  niveauRang: number | null;
  coverage: CoverageScope | null;
  charCount: number;
  pageCount: number | null;
  createdAt: string;
  chunkCount: number;
};

const RICHTING_LABELS: Record<PortfolioRichting, string> = {
  instructeur: "Instructeur",
  leercoach: "Leercoach",
  pvb_beoordelaar: "PvB-beoordelaar",
};

export function PortfolioList({
  handle,
  priors,
  profielen,
}: {
  handle: string;
  priors: PriorSource[];
  profielen: ProfielOption[];
}) {
  // Empty state is handled by the parent page (PortfolioDropZone
  // is shown instead when there are no uploads). This defensive branch
  // only fires if the list is rendered without a preceding gate.
  if (priors.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-4 text-sm text-zinc-600">
        <p>Geen portfolio’s geüpload.</p>
      </div>
    );
  }

  const profielById = new Map(profielen.map((p) => [p.id, p]));

  return (
    <ul className="flex flex-col gap-2">
      {priors.map((p) => (
        <PriorRow
          key={p.sourceId}
          handle={handle}
          prior={p}
          profiel={p.profielId ? profielById.get(p.profielId) : undefined}
        />
      ))}
    </ul>
  );
}

function PriorRow({
  handle,
  prior,
  profiel,
}: {
  handle: string;
  prior: PriorSource;
  profiel: ProfielOption | undefined;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      try {
        await revokePortfolioAction({ sourceId: prior.sourceId, handle });
      } catch (err) {
        // Let Next.js redirect/notFound sentinels propagate (no-op
        // for regular errors).
        unstable_rethrow(err);
        console.error("Failed to revoke", err);
        setConfirming(false);
      }
    });
  }

  // Title resolves to the most specific label available:
  //   1. specific profiel → "{profielTitel} — niveau {N}"
  //   2. richting-only    → "{Richting-label} — niveau {N}"   (legacy)
  //   3. untagged legacy  → niveau (if any) or generic
  const title = profiel
    ? `${profiel.titel} — niveau ${profiel.niveauRang}`
    : prior.richting
      ? `${RICHTING_LABELS[prior.richting]}${
          prior.niveauRang ? ` — niveau ${prior.niveauRang}` : ""
        }`
      : prior.niveauRang
        ? `Niveau ${prior.niveauRang}-portfolio`
        : "PvB-portfolio";

  // Coverage label: renders as a subtle "Kerntaak 4.1" / "Kerntaken 4.1,
  // 4.8" badge when the upload only covers part of the profiel. For
  // full-profiel uploads we omit it entirely (no badge-noise for the
  // default case).
  //
  // The stored `kerntaakCodes` are rang-as-string (ordering key). To
  // render the user-facing dotted code ("4.1") we resolve each back to
  // its source kerntaak and parse the titel — rang is not the display
  // source per NWD domain.
  const coverageLabel = (() => {
    if (!prior.coverage || prior.coverage.type !== "kerntaken") return null;
    const displayCodes = prior.coverage.kerntaakCodes.map((rawCode) => {
      const kt = profiel?.kerntaken.find((k) => String(k.rang) === rawCode);
      return kt ? (parseKerntaakTitel(kt.titel).code ?? rawCode) : rawCode;
    });
    if (displayCodes.length === 1) return `Kerntaak ${displayCodes[0]}`;
    const sorted = displayCodes
      .slice()
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return `Kerntaken ${sorted.join(", ")}`;
  })();

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold text-slate-900">
            {title}
          </span>
          {coverageLabel ? (
            <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
              {coverageLabel}
            </span>
          ) : null}
        </div>
        <span className="text-xs text-slate-500">
          {prior.chunkCount} fragmenten
          {prior.pageCount ? ` · ${prior.pageCount} pagina’s` : ""} · geüpload{" "}
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
