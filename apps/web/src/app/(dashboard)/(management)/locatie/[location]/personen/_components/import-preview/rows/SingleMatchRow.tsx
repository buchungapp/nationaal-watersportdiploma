"use client";

import { memo, use } from "react";
import { Text } from "~/app/(dashboard)/_components/text";
import { BulkImportPreviewContext, assertPreviewContext } from "../context";
import { RowFrame, RowPasted, RowDecisionRadios } from "../primitives";
import type { CandidateMatch, ParsedPersonRow, RowStatus } from "../types";

// One candidate matched. Score band (weak / strong / perfect) controls the
// frame status badge AND whether the match is preselected. Strong-band
// preselects "use existing"; weak and perfect leave it open (twin guard).

export const SingleMatchRow = memo(function SingleMatchRow({
  row,
  candidate,
  status,
}: {
  row: ParsedPersonRow;
  candidate: CandidateMatch;
  status: Extract<RowStatus, "weak-match" | "strong-match" | "perfect-match">;
}) {
  const ctx = assertPreviewContext(use(BulkImportPreviewContext));
  const decision = ctx.state.decisions.get(row.rowIndex);

  return (
    <RowFrame rowIndex={row.rowIndex} status={status}>
      <div className="space-y-3">
        <RowPasted row={row} />
        {status === "perfect-match" ? (
          <Text className="!text-xs !text-amber-700 dark:!text-amber-400">
            Exact dezelfde naam en geboortedatum. Mogelijk dezelfde persoon —
            mogelijk een tweeling/familielid. Kies expliciet.
          </Text>
        ) : null}
        <RowDecisionRadios
          rowIndex={row.rowIndex}
          candidates={[candidate]}
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
