"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { use, useState } from "react";
import Spinner from "~/app/_components/spinner";
import { Button } from "~/app/(dashboard)/_components/button";
import { Text } from "~/app/(dashboard)/_components/text";
import { assertPreviewContext, BulkImportPreviewContext } from "./context";
import type { RowDecision } from "./types";

// Sticky footer rendering the Confirm-and-import button + blocker chip.
// Reads only the derived blocker meta from context, so the rest of the
// preview list doesn't re-render when blocker count changes.

export function PreviewFooter({
  onCancel,
  onSubmit,
  submitting,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const ctx = assertPreviewContext(use(BulkImportPreviewContext));
  const { blockerCount, blockers, canSubmit } = ctx.meta;
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // Personen actually committed (rows that aren't skipped).
  const personenToImport = countToImport(ctx.state.decisions);

  return (
    <div className="sticky bottom-0 -mx-6 mt-4 flex items-center justify-between gap-3 border-t border-zinc-950/10 bg-white px-6 py-3 dark:border-white/10 dark:bg-zinc-900">
      <Button plain onClick={onCancel} disabled={submitting}>
        Annuleren
      </Button>

      <div className="flex items-center gap-3">
        {!canSubmit ? (
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setTooltipOpen(true)}
              onMouseLeave={() => setTooltipOpen(false)}
              onFocus={() => setTooltipOpen(true)}
              onBlur={() => setTooltipOpen(false)}
              aria-describedby="blocker-tooltip"
              className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
            >
              <ExclamationTriangleIcon className="size-4" />
              {blockerCount} {blockerCount === 1 ? "vraag" : "vragen"} om
              aandacht
            </button>
            {tooltipOpen ? (
              <div
                id="blocker-tooltip"
                role="tooltip"
                className="absolute right-0 bottom-full mb-2 w-64 rounded-md border border-zinc-950/10 bg-white p-3 text-xs shadow-lg dark:border-white/10 dark:bg-zinc-900"
              >
                {blockers.unresolvedCrossRowGroups > 0 ? (
                  <Text className="!text-xs">
                    ·{" "}
                    {blockers.unresolvedCrossRowGroups === 1
                      ? "1 groep rijen die mogelijk dezelfde persoon zijn"
                      : `${blockers.unresolvedCrossRowGroups} groepen rijen die mogelijk dezelfde persoon zijn`}
                  </Text>
                ) : null}
                {blockers.unresolvedAmbiguousMatches > 0 ? (
                  <Text className="!text-xs">
                    ·{" "}
                    {blockers.unresolvedAmbiguousMatches === 1
                      ? "1 rij die om een keuze vraagt"
                      : `${blockers.unresolvedAmbiguousMatches} rijen die om een keuze vragen`}
                  </Text>
                ) : null}
                {blockers.parseErrors > 0 ? (
                  <Text className="!text-xs">
                    ·{" "}
                    {blockers.parseErrors === 1
                      ? "1 rij die we niet konden lezen"
                      : `${blockers.parseErrors} rijen die we niet konden lezen`}
                  </Text>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        <Button
          color="branding-orange"
          disabled={!canSubmit || submitting}
          onClick={onSubmit}
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" className="text-white" />
              Bezig met importeren…
            </span>
          ) : (
            `Bevestigen en importeren — ${personenToImport} personen`
          )}
        </Button>
      </div>
    </div>
  );
}

function countToImport(decisions: ReadonlyMap<number, RowDecision>): number {
  let n = 0;
  for (const decision of decisions.values()) {
    if (decision.kind === "create_new" || decision.kind === "use_existing") {
      n += 1;
    }
  }
  return n;
}
