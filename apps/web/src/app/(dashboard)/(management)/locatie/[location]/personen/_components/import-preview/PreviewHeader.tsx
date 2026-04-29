"use client";

import { use } from "react";
import { Strong, Text } from "~/app/(dashboard)/_components/text";
import { assertPreviewContext, BulkImportPreviewContext } from "./context";

// Top-of-preview summary the operator scans first. Reads only meta —
// blocker counts, total row count — so it doesn't re-render when row
// decisions change.

export function PreviewHeader() {
  const ctx = assertPreviewContext(use(BulkImportPreviewContext));
  const rowCount =
    ctx.state.preview.parsedRows.length + ctx.state.preview.parseErrors.length;
  const { blockers, blockerCount } = ctx.meta;

  return (
    <div className="rounded-md border border-zinc-950/10 bg-zinc-50 p-4 text-sm dark:border-white/10 dark:bg-zinc-900/50">
      <Strong>{rowCount} rijen geanalyseerd</Strong>
      {blockerCount === 0 ? (
        <Text className="!text-sm !text-emerald-700 dark:!text-emerald-400">
          Alle rijen zijn klaar voor import.
        </Text>
      ) : (
        <>
          <Text className="!text-sm">Even controleren voor je doorgaat:</Text>
          <ul className="mt-1 ml-2 list-inside list-disc text-zinc-700 dark:text-zinc-300">
            {blockers.unresolvedCrossRowGroups > 0 ? (
              <li>
                {blockers.unresolvedCrossRowGroups === 1
                  ? "1 groep rijen die mogelijk dezelfde persoon zijn"
                  : `${blockers.unresolvedCrossRowGroups} groepen rijen die mogelijk dezelfde persoon zijn`}
              </li>
            ) : null}
            {blockers.unresolvedAmbiguousMatches > 0 ? (
              <li>
                {blockers.unresolvedAmbiguousMatches === 1
                  ? "1 rij die om een keuze vraagt — kies welk profiel erbij hoort"
                  : `${blockers.unresolvedAmbiguousMatches} rijen die om een keuze vragen — kies welk profiel erbij hoort`}
              </li>
            ) : null}
            {blockers.parseErrors > 0 ? (
              <li>
                {blockers.parseErrors === 1
                  ? "1 rij die we niet konden lezen — wordt overgeslagen"
                  : `${blockers.parseErrors} rijen die we niet konden lezen — worden overgeslagen`}
              </li>
            ) : null}
          </ul>
        </>
      )}
    </div>
  );
}
