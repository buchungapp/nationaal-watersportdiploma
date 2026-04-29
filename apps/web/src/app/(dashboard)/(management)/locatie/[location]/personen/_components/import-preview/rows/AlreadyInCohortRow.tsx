"use client";

import { memo, useEffect, use } from "react";
import { Text } from "~/app/(dashboard)/_components/text";
import { BulkImportPreviewContext, assertPreviewContext } from "../context";
import { RowFrame, RowPasted } from "../primitives";
import type { CandidateMatch, ParsedPersonRow } from "../types";

// Match exists, but the matched person is already in the target cohort.
// Default behaviour is "skip" — adding them again would collide on the
// cohort_allocation unique index. Operator can override via the cross-row
// flow if needed (rare).

export const AlreadyInCohortRow = memo(function AlreadyInCohortRow({
  row,
  candidate,
}: {
  row: ParsedPersonRow;
  candidate: CandidateMatch;
}) {
  const ctx = assertPreviewContext(use(BulkImportPreviewContext));
  const decision = ctx.state.decisions.get(row.rowIndex);

  useEffect(() => {
    if (!decision) {
      ctx.actions.setRowDecision(row.rowIndex, {
        kind: "skip",
        reason: "cohort_conflict",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.rowIndex]);

  const fullName = [
    candidate.firstName,
    candidate.lastNamePrefix,
    candidate.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <RowFrame rowIndex={row.rowIndex} status="already-in-cohort">
      <div className="space-y-2">
        <RowPasted row={row} />
        <Text className="!text-xs !text-zinc-600 dark:!text-zinc-400">
          <span className="font-medium">{fullName}</span> staat al in dit
          cohort. Deze rij wordt overgeslagen.
        </Text>
      </div>
    </RowFrame>
  );
});
