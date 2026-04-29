"use client";

import { memo, useEffect, use } from "react";
import { Text } from "~/app/(dashboard)/_components/text";
import { BulkImportPreviewContext, assertPreviewContext } from "../context";
import { RowFrame } from "../primitives";
import type { ParseError } from "../types";

// Row that failed CSV-level validation. Forced to "skip" — the operator
// can't act on data that doesn't parse. Surfaced as a blocker at the top
// of the list so the operator either fixes their paste or accepts the
// skip.

export const ParseErrorRow = memo(function ParseErrorRow({
  parseError,
}: {
  parseError: ParseError;
}) {
  const ctx = assertPreviewContext(use(BulkImportPreviewContext));
  const decision = ctx.state.decisions.get(parseError.rowIndex);

  useEffect(() => {
    if (!decision) {
      ctx.actions.setRowDecision(parseError.rowIndex, {
        kind: "skip",
        reason: "parse_error",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parseError.rowIndex]);

  // Try to surface a human-readable summary. The action returns
  // JSON-stringified Zod field errors; show the keys.
  let humanError = parseError.error;
  try {
    const parsed = JSON.parse(parseError.error) as Record<string, string[]>;
    const fields = Object.keys(parsed);
    if (fields.length > 0) {
      humanError = `Ongeldig: ${fields.join(", ")}`;
    }
  } catch {
    // not JSON, render as-is
  }

  return (
    <RowFrame rowIndex={parseError.rowIndex} status="parse-error">
      <Text className="!text-sm !text-red-700 dark:!text-red-400">
        Deze rij kon niet worden gelezen. {humanError}
      </Text>
      <Text className="!text-xs !text-zinc-500">
        Corrigeer de paste of laat deze rij overgeslagen worden.
      </Text>
    </RowFrame>
  );
});
