"use client";

// Stateless banner for the upload result. Split from the dialog so
// consumers that embed the upload form inline (no dialog) can render
// the same result treatment without duplicating markup.

import type { UploadPriorPortfolioResult } from "../../prior-portfolios/actions";

type Props = {
  result: UploadPriorPortfolioResult | null;
};

export function UploadResultBanner({ result }: Props) {
  if (!result) return null;

  if (result.ok) {
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900">
        <p className="font-semibold">
          {result.alreadyIngested
            ? "Deze versie stond er al."
            : `Succes: ${result.chunkCount} fragmenten opgenomen.`}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
      <p>
        <span className="font-semibold">Mislukt:</span> {result.reason}
      </p>
    </div>
  );
}
