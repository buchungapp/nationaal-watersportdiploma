"use client";

import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { use, useMemo } from "react";
import { Strong } from "~/app/(dashboard)/_components/text";
import {
  assertPreviewContext,
  BulkImportPreviewContext,
  deriveGroupKey,
} from "./context";
import { CrossRowGroupCard } from "./cross-row-conflicts/CrossRowGroupCard";
import { PreviewFooter } from "./PreviewFooter";
import { PreviewHeader } from "./PreviewHeader";
import { classifyRow } from "./provider";
import { AlreadyInCohortRow } from "./rows/AlreadyInCohortRow";
import { MultiMatchRow } from "./rows/MultiMatchRow";
import { NoMatchRow } from "./rows/NoMatchRow";
import { ParseErrorRow } from "./rows/ParseErrorRow";
import { SingleMatchRow } from "./rows/SingleMatchRow";
import { StatusLegend } from "./StatusLegend";
import type { CandidateMatch } from "./types";

// The preview list orchestrator. Maps each row index to the right variant
// component, sorts blockers to the top, collapses the "all good" tail.

export function PreviewStep({
  onCancel,
  onSubmit,
  submitting,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const ctx = assertPreviewContext(use(BulkImportPreviewContext));
  const { preview } = ctx.state;

  const candidatesByRow = useMemo(() => {
    const m = new Map<number, CandidateMatch[]>();
    for (const entry of preview.matches.matchesByRow) {
      m.set(entry.rowIndex, entry.candidates);
    }
    return m;
  }, [preview.matches.matchesByRow]);

  // Build the render order:
  //   1. Cross-row groups (one card per group)
  //   2. Parse errors
  //   3. Ambiguous matches (multi-match)
  //   4. Strong matches
  //   5. "All good" rows (no-match + already-in-cohort) — collapsed by default
  // The classifyRow helper handles the row → status mapping.

  const renderItems = useMemo(() => {
    const items: Array<
      | { kind: "group"; groupIndex: number }
      | { kind: "row"; rowIndex: number; bucket: number }
    > = [];

    // Cross-row groups first.
    for (let i = 0; i < preview.matches.crossRowGroups.length; i++) {
      items.push({ kind: "group", groupIndex: i });
    }

    // Rows in their priority bucket. Rows that are part of an UNRESOLVED
    // cross-row group are skipped (rendered via the group card instead).
    // The release condition must match `classifyRow` in provider.ts: rows
    // only leave the group once "different_people" is BOTH picked AND
    // confirmed. Without the `confirmed` check, an unconfirmed draft (e.g.
    // operator opened the override panel, picked profiles, then cancelled)
    // makes PreviewStep render the rows individually while classifyRow
    // still reports them as in-cross-row-group — causing visual duplication.
    const groupedRowIndices = new Set<number>();
    for (const g of preview.matches.crossRowGroups) {
      const groupKey = deriveGroupKey(g.rowIndices);
      const decision = ctx.state.groupDecisions.get(groupKey);
      const isConfirmedSplit =
        decision?.kind === "different_people" && decision.confirmed;
      if (!isConfirmedSplit) {
        for (const rowIndex of g.rowIndices) groupedRowIndices.add(rowIndex);
      }
    }

    // Parse errors (always blockers).
    for (const e of preview.parseErrors) {
      items.push({ kind: "row", rowIndex: e.rowIndex, bucket: 1 });
    }

    // Parsed rows by classification.
    for (const r of preview.parsedRows) {
      if (groupedRowIndices.has(r.rowIndex)) continue;
      const cls = classifyRow(r.rowIndex, preview, ctx.state.groupDecisions);
      const bucket =
        cls.status === "multi-match"
          ? 2
          : cls.status === "perfect-match"
            ? 3
            : cls.status === "weak-match"
              ? 3
              : cls.status === "strong-match"
                ? 4
                : cls.status === "already-in-cohort"
                  ? 5
                  : cls.status === "no-match"
                    ? 6
                    : 7;
      items.push({ kind: "row", rowIndex: r.rowIndex, bucket });
    }

    // Stable sort by bucket then rowIndex.
    items.sort((a, b) => {
      const aB = a.kind === "group" ? 0 : a.bucket;
      const bB = b.kind === "group" ? 0 : b.bucket;
      if (aB !== bB) return aB - bB;
      const aR = a.kind === "group" ? 0 : a.rowIndex;
      const bR = b.kind === "group" ? 0 : b.rowIndex;
      return aR - bR;
    });

    return items;
  }, [preview, ctx.state.groupDecisions]);

  // Split "all good" rows (bucket 5 or 6) into a collapsed tail.
  const goodTailStart = renderItems.findIndex(
    (item) => item.kind === "row" && item.bucket >= 5,
  );

  const headItems =
    goodTailStart === -1 ? renderItems : renderItems.slice(0, goodTailStart);
  const tailItems =
    goodTailStart === -1 ? [] : renderItems.slice(goodTailStart);
  const tailNoMatch = tailItems.filter(
    (item) => item.kind === "row" && item.bucket === 6,
  ).length;
  const tailAlreadyInCohort = tailItems.filter(
    (item) => item.kind === "row" && item.bucket === 5,
  ).length;
  const tailLabel = (() => {
    if (tailNoMatch > 0 && tailAlreadyInCohort === 0) {
      return `${tailNoMatch} ${tailNoMatch === 1 ? "rij wordt" : "rijen worden"} als nieuw profiel aangemaakt — bekijk`;
    }
    if (tailAlreadyInCohort > 0 && tailNoMatch === 0) {
      return `${tailAlreadyInCohort} ${tailAlreadyInCohort === 1 ? "rij die al in dit cohort zit" : "rijen die al in dit cohort zitten"} — bekijk`;
    }
    return `${tailItems.length} rijen die geen aandacht vragen — bekijk`;
  })();

  return (
    <div className="space-y-4">
      <PreviewHeader />

      <StatusLegend />

      <div className="space-y-3">
        {headItems.map((item, idx) =>
          renderItem(item, idx, preview, candidatesByRow),
        )}
      </div>

      {tailItems.length > 0 ? (
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex w-full items-center justify-between rounded-md border border-zinc-950/10 bg-zinc-50 px-4 py-3 text-left text-sm hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900/50 dark:hover:bg-zinc-900">
                <Strong>{tailLabel}</Strong>
                <ChevronDownIcon
                  className={
                    "size-5 text-zinc-500 transition-transform " +
                    (open ? "rotate-180" : "")
                  }
                />
              </Disclosure.Button>
              <Disclosure.Panel className="mt-2 space-y-3">
                {tailItems.map((item, idx) =>
                  renderItem(item, idx, preview, candidatesByRow),
                )}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      ) : null}

      <PreviewFooter
        onCancel={onCancel}
        onSubmit={onSubmit}
        submitting={submitting}
      />
    </div>
  );
}

function renderItem(
  item:
    | { kind: "group"; groupIndex: number }
    | { kind: "row"; rowIndex: number; bucket: number },
  _key: number,
  preview: ReturnType<typeof assertPreviewContext>["state"]["preview"],
  candidatesByRow: Map<number, CandidateMatch[]>,
): React.ReactNode {
  if (item.kind === "group") {
    const group = preview.matches.crossRowGroups[item.groupIndex];
    if (!group) return null;
    return (
      <CrossRowGroupCard
        key={`group-${item.groupIndex}`}
        group={group}
        parsedRows={preview.parsedRows}
        candidatesByRow={candidatesByRow}
      />
    );
  }
  // Row variants
  const parseError = preview.parseErrors.find(
    (e) => e.rowIndex === item.rowIndex,
  );
  if (parseError) {
    return (
      <ParseErrorRow key={`err-${item.rowIndex}`} parseError={parseError} />
    );
  }
  const row = preview.parsedRows.find((r) => r.rowIndex === item.rowIndex);
  if (!row) return null;
  const candidates = candidatesByRow.get(item.rowIndex) ?? [];
  if (candidates.length === 0) {
    return <NoMatchRow key={`row-${item.rowIndex}`} row={row} />;
  }
  if (candidates[0]?.isAlreadyInTargetCohort) {
    return (
      <AlreadyInCohortRow
        key={`row-${item.rowIndex}`}
        row={row}
        candidate={candidates[0]}
      />
    );
  }
  if (candidates.length >= 2) {
    return (
      <MultiMatchRow
        key={`row-${item.rowIndex}`}
        row={row}
        candidates={candidates}
      />
    );
  }
  // Single match → band by score.
  const top = candidates[0]?.score ?? 0;
  const status =
    top >= 200 ? "perfect-match" : top >= 150 ? "strong-match" : "weak-match";
  const candidate = candidates[0];
  if (!candidate) return null;
  return (
    <SingleMatchRow
      key={`row-${item.rowIndex}`}
      row={row}
      candidate={candidate}
      status={status}
    />
  );
}
