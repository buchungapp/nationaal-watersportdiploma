"use client";

import { memo, use } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import { Strong, Text } from "~/app/(dashboard)/_components/text";
import {
  assertPreviewContext,
  BulkImportPreviewContext,
} from "../context";
import { RowFrame, RowPasted } from "../primitives";
import type { CandidateMatch, ParsedPersonRow } from "../types";

// Match exists, but the matched person is already in the target cohort.
// Default = skip (provider injects skip(cohort_conflict) during render).
//
// Operators can override this per row when the second paste is intentional
// — common case: importing from a booking system where one person signed
// up for two courses in the same cohort. Override flips the decision to
// use_existing → core inserts an additional cohort_allocation alongside
// the existing one (multiple NULL-curriculum allocations per (cohort,
// actor) coexist by design). Tags from the row apply to the new row.

export const AlreadyInCohortRow = memo(function AlreadyInCohortRow({
  row,
  candidate,
}: {
  row: ParsedPersonRow;
  candidate: CandidateMatch;
}) {
  const ctx = assertPreviewContext(use(BulkImportPreviewContext));
  const decision = ctx.state.decisions.get(row.rowIndex);
  // Operator-overridden state: explicit use_existing on a row whose
  // status is already-in-cohort means "yes, add another allocation".
  const isOverridden =
    decision?.kind === "use_existing" && decision.personId === candidate.personId;

  const fullName = [
    candidate.firstName,
    candidate.lastNamePrefix,
    candidate.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const onAddExtra = () => {
    ctx.actions.setRowDecision(row.rowIndex, {
      kind: "use_existing",
      personId: candidate.personId,
    });
  };
  const onRevertToSkip = () => {
    ctx.actions.setRowDecision(row.rowIndex, {
      kind: "skip",
      reason: "cohort_conflict",
    });
  };

  return (
    <RowFrame rowIndex={row.rowIndex} status="already-in-cohort">
      <div className="space-y-3">
        <RowPasted row={row} />
        {isOverridden ? (
          <>
            <Text className="!text-sm !text-zinc-700 dark:!text-zinc-300">
              <Strong>Extra cohortplek wordt aangemaakt.</Strong>{" "}
              <span className="font-medium">{fullName}</span> staat al in dit
              cohort, maar je hebt aangegeven dat dit een tweede cursus is —
              er komt een extra plek bij{" "}
              {row.tags.length > 0
                ? `met tags: ${row.tags.join(", ")}`
                : "(geen tags)"}
              .
            </Text>
            <div>
              <Button plain onClick={onRevertToSkip}>
                Toch overslaan
              </Button>
            </div>
          </>
        ) : (
          <>
            <Text className="!text-xs !text-zinc-600 dark:!text-zinc-400">
              <span className="font-medium">{fullName}</span> staat al in dit
              cohort. Deze rij wordt overgeslagen.
            </Text>
            <Text className="!text-xs !text-zinc-500">
              Is dit een tweede cursus / extra inschrijving voor dezelfde
              persoon? Dan kun je toch een extra cohortplek aanmaken.
            </Text>
            <div>
              <Button plain onClick={onAddExtra}>
                Toch een extra cohortplek aanmaken
              </Button>
            </div>
          </>
        )}
      </div>
    </RowFrame>
  );
});
