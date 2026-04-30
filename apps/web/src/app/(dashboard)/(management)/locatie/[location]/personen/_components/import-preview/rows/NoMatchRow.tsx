"use client";

import { memo } from "react";
import { Text } from "~/app/(dashboard)/_components/text";
import { RowFrame, RowPasted } from "../primitives";
import type { ParsedPersonRow } from "../types";

// Row that didn't match anyone in the operator's location. Default
// behaviour is "create new" — the provider injects that default during
// render so we don't need to dispatch from this component.

export const NoMatchRow = memo(function NoMatchRow({
  row,
}: {
  row: ParsedPersonRow;
}) {
  return (
    <RowFrame rowIndex={row.rowIndex} status="no-match">
      <div className="space-y-2">
        <RowPasted row={row} />
        <Text className="!text-xs !text-zinc-500">
          Geen overeenkomende persoon gevonden in jouw locatie. Wordt aangemaakt
          als nieuw profiel.
        </Text>
      </div>
    </RowFrame>
  );
});
