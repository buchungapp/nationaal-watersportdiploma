"use client";

import {
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getOperatorMergePreflightAction,
  mergeOperatorPersonsAction,
} from "~/app/_actions/person/merge-persons-operator-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Strong, Text } from "~/app/(dashboard)/_components/text";

// Operator-facing merge confirm dialog. Renders a side-by-side
// per-field diff (GitHub-PR-style) so the operator can see at a glance
// which attributes match and which differ before committing the
// (irreversible) merge.
//
// Distinct from the secretariaat merge dialog
// (apps/web/src/app/(dashboard)/(management)/secretariaat/gebruikers/
// _components/merge-persons-dialog.tsx) which has a sysadmin search-
// and-pick UX. Sysadmin dialog stays untouched.

type Person = {
  firstName: string | null;
  lastNamePrefix: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  birthCity?: string | null;
  birthCountry?: { code: string; name: string } | null;
  email?: string | null;
  handle: string | null;
};

type Stats = {
  actorCount: number;
  locationCount: number;
  certificateCount: number;
  // Real issued certificates (only this one is shown in the operator
  // dialog — that's the concept location admins recognize as "diploma's").
  issuedCertificateCount: number;
  logbookCount: number;
  roleCount: number;
  kwalificatieCount: number;
};

export function OperatorMergeConfirmDialog({
  open,
  onClose,
  onMerged,
  primaryPersonId,
  duplicatePersonId,
  locationId,
  source,
}: {
  open: boolean;
  onClose: () => void;
  onMerged?: () => void;
  primaryPersonId: string;
  duplicatePersonId: string;
  locationId: string;
  source: "personen_page" | "cohort_view";
}) {
  // The pair-finder picks primary vs duplicate via a heuristic
  // (isPrimary flag, then created_at). The operator may know better —
  // e.g. they want to keep the side with more diploma history. The
  // swap toggle flips the local primary/duplicate assignment without
  // touching the parent's state. Defaults to false on every open.
  const [swapped, setSwapped] = useState(false);
  useEffect(() => {
    if (open) setSwapped(false);
  }, [open]);

  const effectivePrimaryId = swapped ? duplicatePersonId : primaryPersonId;
  const effectiveDuplicateId = swapped ? primaryPersonId : duplicatePersonId;

  const preflight = useAction(getOperatorMergePreflightAction);
  const merge = useAction(mergeOperatorPersonsAction, {
    onSuccess: () => {
      toast.success("Profielen samengevoegd.");
      onMerged?.();
      onClose();
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? DEFAULT_SERVER_ERROR_MESSAGE);
    },
  });

  useEffect(() => {
    if (open && effectivePrimaryId && effectiveDuplicateId) {
      preflight.execute({
        primaryPersonId: effectivePrimaryId,
        duplicatePersonId: effectiveDuplicateId,
        locationId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, effectivePrimaryId, effectiveDuplicateId, locationId]);

  const data = preflight.result.data;
  const isLoading = preflight.status === "executing" || !data;
  const isMerging = merge.status === "executing";

  return (
    <Dialog open={open} onClose={onClose} size="3xl">
      <DialogTitle>Profielen samenvoegen</DialogTitle>
      <DialogBody>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
            <Text className="ml-2 !text-sm">Laden...</Text>
          </div>
        ) : (
          <>
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSwapped((s) => !s)}
                disabled={isMerging}
                className="inline-flex items-center gap-1.5 rounded text-xs text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-100"
                title="Wissel welk profiel primair is en welk verdwijnt"
              >
                <ArrowsRightLeftIcon className="size-3.5" />
                Wissel primair en duplicaat
              </button>
            </div>
            <DiffTable
              primary={data.primary.person}
              duplicate={data.duplicate.person}
              primaryStats={data.primary.stats}
              duplicateStats={data.duplicate.stats}
            />

            {data.warnings.length > 0 ? (
              <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/10">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="mt-0.5 size-5 shrink-0 text-amber-600" />
                  <ul className="space-y-1">
                    {data.warnings.map((w) => (
                      <li
                        key={w.type}
                        className="text-sm text-amber-800 dark:text-amber-300"
                      >
                        {w.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            <Text className="mt-4 !text-xs !text-zinc-500">
              Samenvoegen is onomkeerbaar. Alle diploma's, cohortplekken en
              actoren van het duplicaat worden overgezet naar het primaire
              profiel. Het duplicaat-profiel wordt verwijderd.
            </Text>
          </>
        )}
      </DialogBody>
      <DialogActions>
        <Button plain onClick={onClose} disabled={isMerging}>
          Annuleren
        </Button>
        <Button
          color="branding-orange"
          disabled={isLoading || isMerging}
          onClick={() =>
            merge.execute({
              primaryPersonId: effectivePrimaryId,
              duplicatePersonId: effectiveDuplicateId,
              locationId,
              source,
            })
          }
        >
          {isMerging ? <Spinner className="text-white" /> : null}
          Bevestigen — samenvoegen
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Per-field diff table ──────────────────────────────────────────────
//
// Side-by-side comparison of identity fields. Each row is one field;
// matching values get a neutral row + ✓; differing values get an
// amber tint + ⚠. Empty/null on one side and a value on the other is
// an "informational" diff (will be picked up automatically) — shown
// the same as a regular diff so the operator can see what's about to
// flow into the primary profile.

type DiffRow = {
  label: string;
  primary: string;
  duplicate: string;
  // "match"   → values are the same. Neutral row, green check.
  // "differ"  → conflict. Amber tint, warning icon. Primary's value wins.
  // "info"    → counts that aren't comparable as match/differ; on merge
  //             the duplicate's value rolls into primary. Neutral row.
  status: "match" | "differ" | "info";
  // Optional explanation, especially useful for "differ" rows where
  // some signal is being lost or "info" rows that need context.
  note?: string;
};

function fullName(p: Person): string {
  return [p.firstName, p.lastNamePrefix, p.lastName]
    .filter((part) => part != null && part !== "")
    .join(" ");
}

function fmt(v: string | null | undefined): string {
  if (v == null || v === "") return "—";
  return v;
}

function buildDiff(primary: Person, duplicate: Person): DiffRow[] {
  const rows: DiffRow[] = [];

  const primName = fullName(primary);
  const dupName = fullName(duplicate);
  rows.push({
    label: "Naam",
    primary: primName || "—",
    duplicate: dupName || "—",
    status:
      primName.toLowerCase() === dupName.toLowerCase() ? "match" : "differ",
  });

  rows.push({
    label: "Geboortedatum",
    primary: fmt(primary.dateOfBirth),
    duplicate: fmt(duplicate.dateOfBirth),
    status:
      Boolean(primary.dateOfBirth) &&
      primary.dateOfBirth === duplicate.dateOfBirth
        ? "match"
        : "differ",
  });

  rows.push({
    label: "Geboorteplaats",
    primary: fmt(primary.birthCity),
    duplicate: fmt(duplicate.birthCity),
    status:
      (primary.birthCity ?? "").trim().toLowerCase() ===
      (duplicate.birthCity ?? "").trim().toLowerCase()
        ? "match"
        : "differ",
  });

  const primCountry = primary.birthCountry?.name ?? null;
  const dupCountry = duplicate.birthCountry?.name ?? null;
  rows.push({
    label: "Geboorteland",
    primary: fmt(primCountry),
    duplicate: fmt(dupCountry),
    status:
      primary.birthCountry?.code === duplicate.birthCountry?.code
        ? "match"
        : "differ",
  });

  // E-mail: only the primary's email is preserved post-merge. If the
  // duplicate has a different email, that signal is lost — flag it.
  const primEmail = (primary.email ?? "").trim().toLowerCase();
  const dupEmail = (duplicate.email ?? "").trim().toLowerCase();
  let emailNote: string | undefined;
  if (primEmail && dupEmail && primEmail !== dupEmail) {
    emailNote = "Het e-mailadres van het duplicaat verdwijnt na samenvoegen.";
  } else if (!primEmail && dupEmail) {
    emailNote =
      "Primair heeft geen e-mailadres — het duplicaat-e-mailadres verdwijnt na samenvoegen.";
  }
  rows.push({
    label: "E-mail",
    primary: fmt(primary.email),
    duplicate: fmt(duplicate.email),
    status: primEmail === dupEmail ? "match" : "differ",
    note: emailNote,
  });

  // Handle is auto-generated and always differs — not a useful diff
  // row. It surfaces inline in the column headers instead, so the
  // operator can still tell the rows apart at a glance.

  return rows;
}

function DiffTable({
  primary,
  duplicate,
  primaryStats,
  duplicateStats,
}: {
  primary: Person;
  duplicate: Person;
  primaryStats: Stats;
  duplicateStats: Stats;
}) {
  const rows = buildDiff(primary, duplicate);
  // Diploma's: the one operator-meaningful concept among the stats.
  // Operators recognise "diploma" as a real-world artefact; "actoren",
  // "locaties", "rollen", "kwalificaties" are sysadmin terminology.
  const diplomaRow: DiffRow = {
    label: "Diploma's",
    primary: String(primaryStats.issuedCertificateCount),
    duplicate: String(duplicateStats.issuedCertificateCount),
    status: "info",
    note:
      duplicateStats.issuedCertificateCount > 0
        ? `Na samenvoegen heeft het primaire profiel ${
            primaryStats.issuedCertificateCount +
            duplicateStats.issuedCertificateCount
          } diploma${
            primaryStats.issuedCertificateCount +
              duplicateStats.issuedCertificateCount ===
            1
              ? ""
              : "'s"
          } — de diploma's van het duplicaat verhuizen mee.`
        : undefined,
  };
  return (
    <div className="overflow-hidden rounded-md border border-zinc-950/10 dark:border-white/10">
      <div className="grid grid-cols-[8.5rem_1fr_1fr] bg-zinc-100 text-xs font-medium text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
        <div className="px-3 py-2">Veld</div>
        <div className="flex flex-wrap items-baseline gap-x-1.5 border-l border-zinc-950/10 px-3 py-2 dark:border-white/10">
          <span>Primair</span>
          <span className="text-zinc-500 font-normal">(blijft)</span>
          {primary.handle ? (
            <span className="ml-auto font-mono text-[11px] font-normal text-zinc-500">
              @{primary.handle}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-1.5 border-l border-zinc-950/10 px-3 py-2 dark:border-white/10">
          <span>Duplicaat</span>
          <span className="text-zinc-500 font-normal">(verdwijnt)</span>
          {duplicate.handle ? (
            <span className="ml-auto font-mono text-[11px] font-normal text-zinc-500">
              @{duplicate.handle}
            </span>
          ) : null}
        </div>
      </div>
      {[...rows, diplomaRow].map((row) => (
        <DiffRowView key={row.label} row={row} />
      ))}
    </div>
  );
}

function DiffRowView({ row }: { row: DiffRow }) {
  const isConflict = row.status === "differ";
  const rowBg = isConflict
    ? "bg-amber-50/60 dark:bg-amber-900/10"
    : "bg-white dark:bg-zinc-900/30";
  const noteBg = isConflict
    ? "bg-amber-50/40 dark:bg-amber-900/5"
    : "bg-zinc-50 dark:bg-zinc-900/20";

  return (
    <>
      <div
        className={
          "grid grid-cols-[8.5rem_1fr_1fr] border-t border-zinc-950/5 text-sm dark:border-white/5 " +
          rowBg
        }
      >
        <div className="flex items-center gap-1.5 px-3 py-2 text-zinc-700 dark:text-zinc-300">
          {row.status === "match" ? (
            <CheckCircleIcon className="size-4 text-emerald-600" />
          ) : row.status === "differ" ? (
            <ExclamationTriangleIcon className="size-4 text-amber-600" />
          ) : (
            // "info" rows: counts that aren't a match/differ comparison
            // (e.g. diploma's). Neutral dot.
            <span className="inline-block size-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />
          )}
          <span className="font-medium">{row.label}</span>
        </div>
        <div className="border-l border-zinc-950/5 px-3 py-2 font-mono text-xs text-zinc-800 dark:border-white/5 dark:text-zinc-200">
          {row.primary}
        </div>
        <div
          className={
            "border-l border-zinc-950/5 px-3 py-2 font-mono text-xs dark:border-white/5 " +
            (isConflict
              ? "text-amber-900 dark:text-amber-200"
              : "text-zinc-800 dark:text-zinc-200")
          }
        >
          {row.duplicate}
        </div>
      </div>
      {row.note ? (
        <div
          className={
            "grid grid-cols-[8.5rem_1fr] border-t border-zinc-950/5 text-xs italic dark:border-white/5 " +
            noteBg
          }
        >
          <div />
          <div className="col-span-1 px-3 py-1.5 text-zinc-600 dark:text-zinc-400">
            {row.note}
          </div>
        </div>
      ) : null}
    </>
  );
}

