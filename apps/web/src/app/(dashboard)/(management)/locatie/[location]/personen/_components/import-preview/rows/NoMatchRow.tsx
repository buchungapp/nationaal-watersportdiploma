"use client";

import { memo, useEffect } from "react";
import { use } from "react";
import { Text } from "~/app/(dashboard)/_components/text";
import { BulkImportPreviewContext, assertPreviewContext } from "../context";
import { RowFrame, RowPasted } from "../primitives";
import type { ParsedPersonRow } from "../types";

// Row that didn't match anyone in the operator's location. Default
// behaviour is "create new" — auto-set the decision on first render so
// the operator doesn't have to confirm a non-decision.

export const NoMatchRow = memo(function NoMatchRow({
  row,
}: {
  row: ParsedPersonRow;
}) {
  const ctx = assertPreviewContext(use(BulkImportPreviewContext));
  const decision = ctx.state.decisions.get(row.rowIndex);

  // Auto-default. Only set once — if the operator later overrides via
  // the cross-row "different people" flow we don't want to clobber.
  useEffect(() => {
    if (!decision) {
      ctx.actions.setRowDecision(row.rowIndex, { kind: "create_new" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.rowIndex]);

  return (
    <RowFrame rowIndex={row.rowIndex} status="no-match">
      <div className="space-y-2">
        <RowPasted row={row} />
        <Text className="!text-xs !text-zinc-500">
          Geen overeenkomende persoon gevonden in jouw locatie. Wordt
          aangemaakt als nieuw profiel.
        </Text>
      </div>
    </RowFrame>
  );
});
