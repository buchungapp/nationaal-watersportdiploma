"use client";

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import dayjs from "dayjs";
import { memo, use, useState } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import { Strong, Text } from "~/app/(dashboard)/_components/text";
import {
  assertPreviewContext,
  BulkImportPreviewContext,
  deriveGroupKey,
} from "../context";
import type { CandidateMatch, CrossRowGroup, ParsedPersonRow } from "../types";
import { CrossRowConflictResolver } from "./CrossRowConflictResolver";

// Card shown in the preview list for a cross-row group. Renders ONCE for
// the group, not per-row. Click "Bekijk" to open the resolver modal.
// Once the operator resolves, the card flips to a "resolved" state with
// a summary and a quick way to revisit.

export const CrossRowGroupCard = memo(function CrossRowGroupCard({
  group,
  parsedRows,
  candidatesByRow,
}: {
  group: CrossRowGroup;
  parsedRows: ParsedPersonRow[];
  candidatesByRow: Map<number, CandidateMatch[]>;
}) {
  const ctx = assertPreviewContext(use(BulkImportPreviewContext));
  const groupKey = deriveGroupKey(group.rowIndices);
  const rawDecision = ctx.state.groupDecisions.get(groupKey);
  // Only treat the group as resolved when there's a definitive decision —
  // an un-confirmed different_people draft from the override panel still
  // needs the operator's Bevestig click.
  const decision =
    rawDecision?.kind === "same_person" ||
    (rawDecision?.kind === "different_people" && rawDecision.confirmed)
      ? rawDecision
      : null;
  const [open, setOpen] = useState(false);

  // The shared candidate is the highest-scoring matched existing person
  // across all rows in the group. Empty for paste-only groups.
  const sharedCandidate = pickSharedCandidate(group, candidatesByRow);

  const groupRows = parsedRows.filter((r) =>
    group.rowIndices.includes(r.rowIndex),
  );

  const headerName = sharedCandidate
    ? [
        sharedCandidate.firstName,
        sharedCandidate.lastNamePrefix,
        sharedCandidate.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    : groupRows[0]
      ? [
          groupRows[0].firstName,
          groupRows[0].lastNamePrefix,
          groupRows[0].lastName,
        ]
          .filter(Boolean)
          .join(" ")
      : "Onbekend";

  return (
    <>
      <article
        aria-label={`${group.rowIndices.length} rijen die mogelijk dezelfde persoon zijn`}
        className={
          "rounded-lg border bg-white shadow-sm dark:bg-zinc-900 " +
          (decision
            ? "border-zinc-950/10 dark:border-white/10"
            : "border-branding-orange/40 ring-1 ring-branding-orange/30")
        }
      >
        <header className="flex items-center justify-between gap-3 border-b border-zinc-950/5 px-4 py-3 dark:border-white/5">
          <div className="flex items-center gap-3">
            {decision ? (
              <CheckCircleIcon className="size-5 text-emerald-600" />
            ) : (
              <ExclamationTriangleIcon className="size-5 text-branding-orange" />
            )}
            <Strong className="!text-sm">
              {group.rowIndices.length} rijen lijken dezelfde persoon
            </Strong>
            <Badge color={decision ? "emerald" : "branding-orange"}>
              {decision ? "Opgelost" : "Vraagt om aandacht"}
            </Badge>
          </div>
          <Button plain onClick={() => setOpen(true)}>
            {decision ? "Bekijken / wijzigen" : "Bekijk en bevestig"}
          </Button>
        </header>
        <div className="px-4 py-3 text-sm">
          <Text>
            <Strong>{headerName}</Strong>
            {sharedCandidate?.dateOfBirth ? (
              <>
                {" · "}
                {dayjs(sharedCandidate.dateOfBirth).format("DD-MM-YYYY")}
              </>
            ) : null}
            {sharedCandidate
              ? ` · bestaand profiel met ${sharedCandidate.certificateCount} diploma${sharedCandidate.certificateCount === 1 ? "" : "'s"}`
              : " · nieuw profiel (bestaat nog niet)"}
          </Text>
          <Text className="!text-xs !text-zinc-500">
            Rijen: {group.rowIndices.map((r) => r + 1).join(", ")}
          </Text>
          {decision ? (
            <Text className="!text-xs !text-emerald-700 dark:!text-emerald-400">
              {decision.kind === "same_person"
                ? "Bevestigd als zelfde persoon."
                : "Per rij apart geregeld (verschillende personen)."}
            </Text>
          ) : null}
        </div>
      </article>
      <CrossRowConflictResolver
        open={open}
        onClose={() => setOpen(false)}
        group={group}
        parsedRows={parsedRows}
        sharedCandidate={sharedCandidate}
      />
    </>
  );
});

function pickSharedCandidate(
  group: CrossRowGroup,
  candidatesByRow: Map<number, CandidateMatch[]>,
): CandidateMatch | null {
  if (group.sharedCandidatePersonIds.length === 0) return null;
  const targetId = group.sharedCandidatePersonIds[0];
  for (const rowIndex of group.rowIndices) {
    const candidates = candidatesByRow.get(rowIndex) ?? [];
    const found = candidates.find((c) => c.personId === targetId);
    if (found) return found;
  }
  return null;
}
