"use client";

import { memo } from "react";
import { Text } from "~/app/(dashboard)/_components/text";
import { RowFrame, RowPasted } from "../primitives";
import type { CandidateMatch, ParsedPersonRow } from "../types";

// Match exists, but the matched person is already in the target cohort.
// Default behaviour is "skip" — provider injects that default during
// render. Adding them again would collide on the cohort_allocation
// unique index. Operator can override via the cross-row flow if needed.

export const AlreadyInCohortRow = memo(function AlreadyInCohortRow({
  row,
  candidate,
}: {
  row: ParsedPersonRow;
  candidate: CandidateMatch;
}) {
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
