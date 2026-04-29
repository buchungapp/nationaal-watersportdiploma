"use client";

import { ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/20/solid";
import dayjs from "dayjs";
import { memo, useState, use } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Strong, Text, TextLink } from "~/app/(dashboard)/_components/text";
import {
  assertPreviewContext,
  BulkImportPreviewContext,
  deriveGroupKey,
} from "../context";
import { RowDecisionRadios } from "../primitives";
import type {
  CandidateMatch,
  CrossRowGroup,
  ParsedPersonRow,
  RowDecision,
} from "../types";

// The variant F modal made real. Default action: one click confirms the
// safe outcome ("zelfde persoon"). Override path: secondary text-link
// reveals per-row decisions for the rare twin/cousin case.

export const CrossRowConflictResolver = memo(
  function CrossRowConflictResolver({
    open,
    onClose,
    group,
    parsedRows,
    sharedCandidate,
  }: {
    open: boolean;
    onClose: () => void;
    group: CrossRowGroup;
    parsedRows: ParsedPersonRow[];
    // null when paste-only group — operator confirms creating ONE shared
    // new person for the group.
    sharedCandidate: CandidateMatch | null;
  }) {
    const ctx = assertPreviewContext(use(BulkImportPreviewContext));
    const groupKey = deriveGroupKey(group.rowIndices);
    const existingDecision = ctx.state.groupDecisions.get(groupKey);
    const hasCohort = Boolean(ctx.meta.targetCohortId);
    const [showOverride, setShowOverride] = useState(
      existingDecision?.kind === "different_people",
    );

    const groupRows = parsedRows.filter((r) =>
      group.rowIndices.includes(r.rowIndex),
    );
    const targetPersonId = sharedCandidate?.personId ?? null;

    const onConfirmSamePerson = () => {
      ctx.actions.setGroupDecision(groupKey, {
        kind: "same_person",
        targetPersonId,
      });
      onClose();
    };

    const candidateName = sharedCandidate
      ? [
          sharedCandidate.firstName,
          sharedCandidate.lastNamePrefix,
          sharedCandidate.lastName,
        ]
          .filter(Boolean)
          .join(" ")
      : null;

    const candidateDob = sharedCandidate?.dateOfBirth
      ? dayjs(sharedCandidate.dateOfBirth).format("DD-MM-YYYY")
      : null;

    return (
      <Dialog open={open} onClose={onClose} size="2xl">
        <div className="flex items-start gap-3">
          {sharedCandidate ? (
            <InformationCircleIcon className="size-6 shrink-0 text-branding-dark" />
          ) : (
            <ExclamationTriangleIcon className="size-6 shrink-0 text-branding-orange" />
          )}
          <DialogTitle>
            {group.rowIndices.length} rijen lijken dezelfde persoon te zijn
          </DialogTitle>
        </div>
        <DialogBody>
          {sharedCandidate ? (
            <FocusProfile
              name={candidateName ?? "Onbekend"}
              dob={candidateDob ?? "—"}
              email={sharedCandidate.dateOfBirth ?? null}
              certificateCount={sharedCandidate.certificateCount}
              lastDiplomaIssuedAt={sharedCandidate.lastDiplomaIssuedAt}
            />
          ) : (
            <NewProfileBanner row={groupRows[0]} />
          )}

          <Outcome
            group={group}
            isPasteOnly={!sharedCandidate}
            hasCohort={hasCohort}
          />

          <PastedRowsList rows={groupRows} />

          {showOverride ? (
            <DifferentPeopleOverride
              groupKey={groupKey}
              groupRows={groupRows}
              sharedCandidate={sharedCandidate}
            />
          ) : null}
        </DialogBody>

        <DialogActions>
          <Button plain onClick={onClose}>
            Annuleren
          </Button>
          {!showOverride ? (
            <Button color="branding-orange" onClick={onConfirmSamePerson}>
              Bevestig — zelfde persoon
            </Button>
          ) : null}
        </DialogActions>

        <div className="mt-3 flex items-center justify-between text-xs">
          {!showOverride ? (
            <button
              type="button"
              onClick={() => setShowOverride(true)}
              className="text-branding-dark underline-offset-2 hover:underline"
            >
              Het zijn verschillende personen — bijv. tweelingen
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowOverride(false)}
              className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              ← Toch zelfde persoon
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onClose();
            }}
            className="text-zinc-500 underline-offset-2 hover:underline"
          >
            Plak opnieuw
          </button>
        </div>
      </Dialog>
    );
  },
);

function FocusProfile({
  name,
  dob,
  email,
  certificateCount,
  lastDiplomaIssuedAt,
}: {
  name: string;
  dob: string;
  email: string | null;
  certificateCount: number;
  lastDiplomaIssuedAt: string | null;
}) {
  return (
    <div className="rounded-md border border-zinc-950/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900/50">
      <Strong className="!text-base">{name}</Strong>
      <Text className="!text-sm !text-zinc-600 dark:!text-zinc-400">
        {dob}
        {email ? ` · ${email}` : ""}
      </Text>
      <Text className="!text-xs !text-zinc-500">
        {certificateCount > 0
          ? `${certificateCount} diploma${certificateCount === 1 ? "" : "'s"}`
          : "Geen diploma's"}
        {lastDiplomaIssuedAt
          ? ` · Laatste diploma: ${dayjs(lastDiplomaIssuedAt).format("MMM YYYY")}`
          : ""}
      </Text>
    </div>
  );
}

function NewProfileBanner({ row }: { row: ParsedPersonRow | undefined }) {
  if (!row) return null;
  const name = [row.firstName, row.lastNamePrefix, row.lastName]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="rounded-md border border-zinc-950/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900/50">
      <Strong className="!text-base">{name}</Strong>
      <Text className="!text-sm !text-zinc-600 dark:!text-zinc-400">
        {dayjs(row.dateOfBirth).format("DD-MM-YYYY")}
      </Text>
      <Text className="!text-xs !text-zinc-500 italic">
        Nieuw profiel — bestaat nog niet in jouw roster.
      </Text>
    </div>
  );
}

function Outcome({
  group,
  isPasteOnly,
  hasCohort,
}: {
  group: CrossRowGroup;
  isPasteOnly: boolean;
  hasCohort: boolean;
}) {
  const profileSummary = isPasteOnly
    ? "1 nieuw profiel aangemaakt voor deze persoon"
    : "1 bestaand profiel gebruikt";
  const cohortSummary = hasCohort ? " en 1 cohortplek aangemaakt" : "";
  return (
    <div className="mt-4 space-y-2">
      <Text>
        Bij bevestigen wordt{" "}
        <Strong>
          {profileSummary}
          {cohortSummary}
        </Strong>
        . De {group.rowIndices.length} rijen verwijzen naar dezelfde persoon —
        geen dubbele profielen.
      </Text>
      {hasCohort ? (
        <Text className="!text-sm !text-zinc-500">
          Wil je deze persoon aan meerdere cursussen binnen dit cohort
          koppelen? Dat doe je na de import via de cohortpagina.
        </Text>
      ) : null}
    </div>
  );
}

function PastedRowsList({ rows }: { rows: ParsedPersonRow[] }) {
  return (
    <div className="mt-4">
      <Strong className="!text-sm">
        De {rows.length} rijen die we als dezelfde persoon behandelen:
      </Strong>
      <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        {rows.map((r) => {
          const name = [r.firstName, r.lastNamePrefix, r.lastName]
            .filter(Boolean)
            .join(" ");
          return (
            <li key={r.rowIndex}>
              Rij {r.rowIndex + 1}: {name} ·{" "}
              {dayjs(r.dateOfBirth).format("DD-MM-YYYY")}
              {r.email ? ` · ${r.email}` : ""}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DifferentPeopleOverride({
  groupKey,
  groupRows,
  sharedCandidate,
}: {
  groupKey: string;
  groupRows: ParsedPersonRow[];
  sharedCandidate: CandidateMatch | null;
}) {
  const ctx = assertPreviewContext(use(BulkImportPreviewContext));
  const groupDecision = ctx.state.groupDecisions.get(groupKey);
  const perRow =
    groupDecision?.kind === "different_people" ? groupDecision.perRow : {};

  const setRow = (rowIndex: number, decision: RowDecision) => {
    ctx.actions.setGroupDecision(groupKey, {
      kind: "different_people",
      perRow: { ...perRow, [rowIndex]: decision },
    });
  };

  return (
    <div className="mt-4 rounded-md border border-zinc-950/10 bg-amber-50/50 p-4 dark:border-white/10 dark:bg-amber-900/10">
      <Strong className="!text-sm">
        Per rij beslissen — verschillende personen
      </Strong>
      <Text className="!text-xs !text-zinc-600 dark:!text-zinc-400">
        Voor elke rij: wil je deze koppelen aan{" "}
        {sharedCandidate ? "het bestaande profiel" : "een (eigen) nieuw profiel"}
        , of een ander profiel?
      </Text>
      <div className="mt-3 space-y-2">
        {groupRows.map((r) => {
          const decision = perRow[r.rowIndex];
          const name = [r.firstName, r.lastNamePrefix, r.lastName]
            .filter(Boolean)
            .join(" ");
          return (
            <div
              key={r.rowIndex}
              className="rounded border border-zinc-950/5 bg-white p-3 text-sm dark:border-white/5 dark:bg-zinc-900/50"
            >
              <div className="font-medium">
                Rij {r.rowIndex + 1}: {name}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {sharedCandidate ? (
                  <button
                    type="button"
                    onClick={() =>
                      setRow(r.rowIndex, {
                        kind: "use_existing",
                        personId: sharedCandidate.personId,
                      })
                    }
                    className={
                      "rounded border px-2 py-1 text-xs " +
                      (decision?.kind === "use_existing"
                        ? "border-branding-dark bg-branding-light/10"
                        : "border-zinc-950/10 hover:bg-zinc-50")
                    }
                  >
                    Koppel aan bestaand profiel
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setRow(r.rowIndex, { kind: "create_new" })}
                  className={
                    "rounded border px-2 py-1 text-xs " +
                    (decision?.kind === "create_new"
                      ? "border-branding-dark bg-branding-light/10"
                      : "border-zinc-950/10 hover:bg-zinc-50")
                  }
                >
                  Maak nieuw profiel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRow(r.rowIndex, {
                      kind: "skip",
                      reason: "operator",
                    })
                  }
                  className={
                    "rounded border px-2 py-1 text-xs " +
                    (decision?.kind === "skip"
                      ? "border-zinc-950 bg-zinc-100"
                      : "border-zinc-950/10 hover:bg-zinc-50")
                  }
                >
                  Sla over
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
