"use client";

import { memo, use } from "react";
import { Text } from "~/app/(dashboard)/_components/text";
import { assertPreviewContext, BulkImportPreviewContext } from "../context";
import { RowDecisionRadios, RowFrame, RowPasted } from "../primitives";
import type { CandidateMatch, ParsedPersonRow } from "../types";

// Row with ≥2 candidates above the weak threshold. Never preselects —
// operator must click. The approved variant D mockup is the visual
// reference (calmer score chips, equal-weight cards).

export const MultiMatchRow = memo(function MultiMatchRow({
  row,
  candidates,
}: {
  row: ParsedPersonRow;
  candidates: CandidateMatch[];
}) {
  const ctx = assertPreviewContext(use(BulkImportPreviewContext));
  const decision = ctx.state.decisions.get(row.rowIndex);

  return (
    <RowFrame rowIndex={row.rowIndex} status="multi-match">
      <div className="space-y-3">
        <RowPasted row={row} />
        <Text className="!text-xs !text-zinc-600 dark:!text-zinc-400">
          {candidates.length} mogelijke profielen in jouw locatie. Kies welk
          profiel hierbij hoort, of maak een nieuw profiel aan.
        </Text>
        <RowDecisionRadios
          rowIndex={row.rowIndex}
          candidates={candidates}
          allowCreateNew
        />
        {!decision ? (
          <Text className="!text-xs !text-zinc-500">
            Maak een keuze om verder te gaan.
          </Text>
        ) : null}
      </div>
    </RowFrame>
  );
});
