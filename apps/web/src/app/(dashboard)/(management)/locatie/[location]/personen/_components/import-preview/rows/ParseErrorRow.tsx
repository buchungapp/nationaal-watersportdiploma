"use client";

import { memo, useEffect, use } from "react";
import { Strong, Text } from "~/app/(dashboard)/_components/text";
import { BulkImportPreviewContext, assertPreviewContext } from "../context";
import { RowFrame } from "../primitives";
import type { ParseError } from "../types";

// Row that failed CSV-level validation. Auto-defaults to skip — the
// operator can't act on data that doesn't parse. Doesn't block submit
// (the row is silently skipped), but shows the operator what was
// pasted + which fields couldn't be read so they can spot a typo and
// fix it in their CSV editor for the next round if they care.

const FIELD_LABELS_BY_INDEX: Record<string, string> = {
  "0": "E-mailadres",
  "1": "Voornaam",
  "2": "Tussenvoegsel",
  "3": "Achternaam",
  "4": "Geboortedatum",
  "5": "Geboorteplaats",
  "6": "Geboorteland",
};

const FIELD_LABELS_ORDERED = [
  "E-mailadres",
  "Voornaam",
  "Tussenvoegsel",
  "Achternaam",
  "Geboortedatum",
  "Geboorteplaats",
  "Geboorteland",
];

const FIELD_PROBLEM_HINTS: Record<string, string> = {
  "0": "controleer of het een geldig e-mailadres is",
  "4": "gebruik het formaat JJJJ-MM-DD (bijvoorbeeld 2010-05-12)",
  "6": "gebruik een tweeletter-landcode (bijvoorbeeld 'nl')",
};

function humanizeError(rawError: string): {
  fields: string[];
  failedIndices: Set<string>;
  hint: string | null;
} {
  try {
    const parsed = JSON.parse(rawError) as Record<string, string[]>;
    const indices = Object.keys(parsed);
    const fields = indices
      .map((idx) => FIELD_LABELS_BY_INDEX[idx] ?? `Veld ${Number(idx) + 1}`)
      .filter(Boolean);
    const hint = indices
      .map((idx) => FIELD_PROBLEM_HINTS[idx])
      .find((h): h is string => Boolean(h));
    return {
      fields,
      failedIndices: new Set(indices),
      hint: hint ?? null,
    };
  } catch {
    return { fields: [], failedIndices: new Set(), hint: null };
  }
}

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

  const { fields, failedIndices, hint } = humanizeError(parseError.error);
  const values = parseError.values ?? [];
  const hasAnyValue = values.some((v) => v && v.trim().length > 0);

  return (
    <RowFrame rowIndex={parseError.rowIndex} status="parse-error">
      <div className="space-y-3">
        <Text className="!text-sm">
          <Strong>Wordt overgeslagen.</Strong> Deze rij konden we niet
          lezen
          {fields.length > 0 ? (
            <>
              {" — "}probleem in:{" "}
              <span className="font-medium">{fields.join(", ")}</span>
            </>
          ) : null}
          .
        </Text>
        {hint ? (
          <Text className="!text-xs !text-zinc-600 dark:!text-zinc-400">
            Tip: {hint}.
          </Text>
        ) : null}
        {hasAnyValue ? (
          <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 rounded-md border border-zinc-950/5 bg-zinc-50 p-3 text-xs dark:border-white/5 dark:bg-zinc-900/40">
            {FIELD_LABELS_ORDERED.map((label, idx) => {
              const value = values[idx] ?? "";
              const failed = failedIndices.has(String(idx));
              return (
                <div key={label} className="contents">
                  <dt className="text-zinc-500">{label}</dt>
                  <dd
                    className={
                      "font-mono " +
                      (failed
                        ? "text-red-700 dark:text-red-400"
                        : "text-zinc-800 dark:text-zinc-200")
                    }
                  >
                    {value.length > 0 ? (
                      value
                    ) : (
                      <span className="italic text-zinc-400">leeg</span>
                    )}
                    {failed ? (
                      <span className="ml-2 text-red-600 dark:text-red-400">
                        ← niet geldig
                      </span>
                    ) : null}
                  </dd>
                </div>
              );
            })}
          </dl>
        ) : null}
        <Text className="!text-xs !text-zinc-500">
          Wil je deze persoon toch toevoegen? Sluit de dialoog, corrigeer
          de rij in je bron (Excel/Google Sheets) en plak opnieuw. De
          andere rijen kunnen gewoon doorgaan — deze rij blokkeert de
          import niet.
        </Text>
      </div>
    </RowFrame>
  );
});
