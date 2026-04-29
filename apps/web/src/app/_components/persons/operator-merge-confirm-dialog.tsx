"use client";

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
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
    if (open && primaryPersonId && duplicatePersonId) {
      preflight.execute({
        primaryPersonId,
        duplicatePersonId,
        locationId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, primaryPersonId, duplicatePersonId, locationId]);

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
            <DiffTable
              primary={data.primary.person}
              duplicate={data.duplicate.person}
            />
            <StatsRoll
              primary={data.primary.stats}
              duplicate={data.duplicate.stats}
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
              primaryPersonId,
              duplicatePersonId,
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
  match: boolean;
  // Optional note for non-conflict diffs ("primair krijgt deze waarde",
  // "automatisch gegenereerd", etc).
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
    match: primName.toLowerCase() === dupName.toLowerCase(),
  });

  rows.push({
    label: "Geboortedatum",
    primary: fmt(primary.dateOfBirth),
    duplicate: fmt(duplicate.dateOfBirth),
    match:
      Boolean(primary.dateOfBirth) &&
      primary.dateOfBirth === duplicate.dateOfBirth,
  });

  rows.push({
    label: "Geboorteplaats",
    primary: fmt(primary.birthCity),
    duplicate: fmt(duplicate.birthCity),
    match:
      (primary.birthCity ?? "").trim().toLowerCase() ===
      (duplicate.birthCity ?? "").trim().toLowerCase(),
  });

  const primCountry = primary.birthCountry?.name ?? null;
  const dupCountry = duplicate.birthCountry?.name ?? null;
  rows.push({
    label: "Geboorteland",
    primary: fmt(primCountry),
    duplicate: fmt(dupCountry),
    match:
      primary.birthCountry?.code ===
      duplicate.birthCountry?.code,
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
    match: primEmail === dupEmail,
    note: emailNote,
  });

  // Handle: always different by design (auto-generated, unique). Keep
  // it informational so the operator can spot which row is which, but
  // don't flag as a "conflict".
  rows.push({
    label: "Handle",
    primary: primary.handle ? `@${primary.handle}` : "—",
    duplicate: duplicate.handle ? `@${duplicate.handle}` : "—",
    match: true,
    note: "Automatisch gegenereerd — verschilt altijd.",
  });

  return rows;
}

function DiffTable({
  primary,
  duplicate,
}: {
  primary: Person;
  duplicate: Person;
}) {
  const rows = buildDiff(primary, duplicate);
  return (
    <div className="overflow-hidden rounded-md border border-zinc-950/10 dark:border-white/10">
      <div className="grid grid-cols-[8.5rem_1fr_1fr] bg-zinc-100 text-xs font-medium text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
        <div className="px-3 py-2">Veld</div>
        <div className="border-l border-zinc-950/10 px-3 py-2 dark:border-white/10">
          Primair
          <span className="ml-1 text-zinc-500 font-normal">(blijft)</span>
        </div>
        <div className="border-l border-zinc-950/10 px-3 py-2 dark:border-white/10">
          Duplicaat
          <span className="ml-1 text-zinc-500 font-normal">(verdwijnt)</span>
        </div>
      </div>
      {rows.map((row) => (
        <DiffRowView key={row.label} row={row} />
      ))}
    </div>
  );
}

function DiffRowView({ row }: { row: DiffRow }) {
  const isConflict = !row.match;
  return (
    <>
      <div
        className={
          "grid grid-cols-[8.5rem_1fr_1fr] border-t border-zinc-950/5 text-sm dark:border-white/5 " +
          (isConflict
            ? "bg-amber-50/60 dark:bg-amber-900/10"
            : "bg-white dark:bg-zinc-900/30")
        }
      >
        <div className="flex items-center gap-1.5 px-3 py-2 text-zinc-700 dark:text-zinc-300">
          {isConflict ? (
            <ExclamationTriangleIcon className="size-4 text-amber-600" />
          ) : (
            <CheckCircleIcon className="size-4 text-emerald-600" />
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
            (isConflict
              ? "bg-amber-50/40 dark:bg-amber-900/5"
              : "bg-zinc-50 dark:bg-zinc-900/20")
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

// ─── Stats roll-up ─────────────────────────────────────────────────────
//
// Counts on each side + the post-merge total. After merge, every entity
// from the duplicate (actors, certificates, allocations, logbook,
// roles, qualifications) attaches to the primary, so the totals are
// straightforward sums.

const STAT_LABELS: Array<{
  key: keyof Stats;
  singular: string;
  plural: string;
}> = [
  { key: "certificateCount", singular: "diploma", plural: "diploma's" },
  { key: "actorCount", singular: "actor", plural: "actoren" },
  { key: "locationCount", singular: "locatie", plural: "locaties" },
  { key: "roleCount", singular: "rol", plural: "rollen" },
  { key: "kwalificatieCount", singular: "kwalificatie", plural: "kwalificaties" },
  { key: "logbookCount", singular: "logboek-item", plural: "logboek-items" },
];

function StatsRoll({
  primary,
  duplicate,
}: {
  primary: Stats;
  duplicate: Stats;
}) {
  // One <table> instead of per-row <div grid>s — that way column widths
  // are shared across header + rows. The earlier grid-per-row layout
  // sized each column to its own content, so the headers (wide words)
  // and the body cells (single digits) drifted apart.
  return (
    <div className="mt-4">
      <Strong className="!text-sm">Wat verhuist naar het primaire profiel</Strong>
      <div className="mt-2 overflow-hidden rounded-md border border-zinc-950/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-xs font-medium text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Soort</th>
              <th className="w-20 border-l border-zinc-950/10 px-3 py-2 text-right font-medium dark:border-white/10">
                Primair
              </th>
              <th className="w-20 border-l border-zinc-950/10 px-3 py-2 text-right font-medium dark:border-white/10">
                Duplicaat
              </th>
              <th className="w-20 border-l border-zinc-950/10 px-3 py-2 text-right font-medium dark:border-white/10">
                Na merge
              </th>
            </tr>
          </thead>
          <tbody>
            {STAT_LABELS.map(({ key, singular, plural }) => {
              const p = primary[key];
              const d = duplicate[key];
              const total = p + d;
              const moved = d > 0;
              return (
                <tr
                  key={key}
                  className="border-t border-zinc-950/5 bg-white dark:border-white/5 dark:bg-zinc-900/30"
                >
                  <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                    {total === 1 ? singular : plural}
                  </td>
                  <td className="border-l border-zinc-950/5 px-3 py-2 text-right tabular-nums text-zinc-700 dark:border-white/5 dark:text-zinc-300">
                    {p}
                  </td>
                  <td
                    className={
                      "border-l border-zinc-950/5 px-3 py-2 text-right tabular-nums dark:border-white/5 " +
                      (moved
                        ? "font-medium text-amber-700 dark:text-amber-300"
                        : "text-zinc-500")
                    }
                  >
                    {d}
                  </td>
                  <td className="border-l border-zinc-950/5 px-3 py-2 text-right tabular-nums font-medium text-zinc-900 dark:border-white/5 dark:text-zinc-100">
                    {total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
