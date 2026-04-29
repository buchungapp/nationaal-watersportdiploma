"use client";

import dayjs from "dayjs";
import { use } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Strong, Text } from "~/app/(dashboard)/_components/text";
import {
  assertPreviewContext,
  BulkImportPreviewContext,
} from "./context";
import type { CandidateMatch, ParsedPersonRow, RowStatus } from "./types";

// Compound primitives consumed by every row variant. Each consumes the
// preview context via `use()` (React 19 — no useContext, no forwardRef).
// Variants compose only the primitives they need; the primitives never
// drill state via props.

// ─── Status badge ──────────────────────────────────────────────────────────
//
// One-glance label of the row's state. Color + Dutch copy follow the
// design doc's status taxonomy. Exported so variants can declare their
// own status (rendering is centralized here).

export const STATUS_BADGE_LABELS: Record<RowStatus, string> = {
  "no-match": "Nieuw",
  "weak-match": "Lijkt op een bestaand profiel",
  "strong-match": "Mogelijk dezelfde",
  "perfect-match": "Vrijwel zeker dezelfde",
  "multi-match": "Meerdere mogelijke profielen",
  "already-in-cohort": "Zit al in dit cohort",
  "parse-error": "Fout in rij",
  "in-cross-row-group": "Meerdere rijen, dezelfde persoon",
};

const STATUS_BADGE_COLORS: Record<
  RowStatus,
  Parameters<typeof Badge>[0]["color"]
> = {
  "no-match": "zinc",
  "weak-match": "zinc",
  "strong-match": "amber",
  "perfect-match": "blue",
  "multi-match": "amber",
  "already-in-cohort": "zinc",
  "parse-error": "red",
  "in-cross-row-group": "branding-light",
};

export function StatusBadge({ status }: { status: RowStatus }) {
  return (
    <Badge color={STATUS_BADGE_COLORS[status]}>
      {STATUS_BADGE_LABELS[status]}
    </Badge>
  );
}

// ─── Row frame ─────────────────────────────────────────────────────────────
//
// The structural shell every row variant renders inside. Top-level row
// label, status badge slot, body slot, footer slot. Frames have stable
// structure so the operator's eye lands on the same place regardless of
// which variant is rendering.

export function RowFrame({
  rowIndex,
  status,
  children,
  footer,
}: {
  rowIndex: number;
  status: RowStatus;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <article
      aria-label={`Rij ${rowIndex}, status: ${STATUS_BADGE_LABELS[status]}`}
      className="rounded-lg border border-zinc-950/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900"
    >
      <header className="flex items-center justify-between gap-3 border-b border-zinc-950/5 px-4 py-3 dark:border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Rij {rowIndex + 1}
          </span>
          <StatusBadge status={status} />
        </div>
      </header>
      <div className="px-4 py-4">{children}</div>
      {footer ? (
        <footer className="border-t border-zinc-950/5 px-4 py-3 dark:border-white/5">
          {footer}
        </footer>
      ) : null}
    </article>
  );
}

// ─── Pasted row data block ─────────────────────────────────────────────────
//
// Echoes back what the operator pasted, so they can verify the system
// understood their CSV row before deciding what to do with it.

export function RowPasted({ row }: { row: ParsedPersonRow }) {
  const fullName = [row.firstName, row.lastNamePrefix, row.lastName]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="text-sm text-zinc-700 dark:text-zinc-300">
      <Text className="!text-sm">
        <Strong>Geplakt</Strong>: {fullName} ·{" "}
        {dayjs(row.dateOfBirth).format("DD-MM-YYYY")} · {row.email}
        {row.birthCity ? ` · ${row.birthCity}` : ""}
      </Text>
    </div>
  );
}

// ─── Candidate card ────────────────────────────────────────────────────────
//
// Renders one matched existing-person candidate. Uses muted score-band
// chips (per the approved variant D mockup): zinc for weak, amber for
// strong, blue for perfect. The card chrome stays the same across bands —
// only the score chip + reasons differentiate.

export function RowCandidate({
  candidate,
  pastedRow,
  selected,
  onSelect,
  showRadio = true,
}: {
  candidate: CandidateMatch;
  // When provided, the card shows an inline field-by-field diff between
  // what the operator pasted and what's on the existing profile, so
  // small differences (DOB off by a day, different city) jump out.
  pastedRow?: ParsedPersonRow;
  selected: boolean;
  onSelect?: () => void;
  showRadio?: boolean;
}) {
  const fullName = [
    candidate.firstName,
    candidate.lastNamePrefix,
    candidate.lastName,
  ]
    .filter(Boolean)
    .join(" ");
  const lastDiploma = candidate.lastDiplomaIssuedAt
    ? dayjs(candidate.lastDiplomaIssuedAt).format("MMM YYYY")
    : null;
  const scoreColor: Parameters<typeof Badge>[0]["color"] =
    candidate.score >= 200
      ? "blue"
      : candidate.score >= 150
        ? "amber"
        : "zinc";
  const scoreLabel =
    candidate.score >= 200
      ? "Vrijwel zeker dezelfde"
      : candidate.score >= 150
        ? "Mogelijk dezelfde"
        : "Lijkt erop";

  const diff = pastedRow ? computeDiff(pastedRow, candidate) : null;

  return (
    <label
      className={
        "flex cursor-pointer gap-3 rounded-md border p-3 transition-colors " +
        (selected
          ? "border-branding-dark bg-branding-light/5"
          : "border-zinc-950/10 hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-zinc-800/50")
      }
    >
      {showRadio ? (
        <input
          type="radio"
          checked={selected}
          onChange={onSelect}
          className="mt-1.5 size-4 shrink-0 accent-branding-dark"
          aria-label={`Selecteer ${fullName}`}
        />
      ) : null}
      <div className="flex-1 space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-zinc-950 dark:text-white">
            {fullName}
          </span>
          <Badge color={scoreColor}>{scoreLabel}</Badge>
        </div>
        {diff ? (
          <CandidateDiff diff={diff} />
        ) : (
          <Text className="!text-xs !text-zinc-600 dark:!text-zinc-400">
            {candidate.dateOfBirth
              ? dayjs(candidate.dateOfBirth).format("DD-MM-YYYY")
              : "—"}
            {candidate.birthCity ? ` · ${candidate.birthCity}` : ""}
          </Text>
        )}
        <Text className="!text-xs !text-zinc-500 dark:!text-zinc-500">
          {candidate.certificateCount > 0
            ? `${candidate.certificateCount} diploma${candidate.certificateCount === 1 ? "" : "'s"}`
            : "Geen diploma's"}
          {lastDiploma ? ` · Laatste diploma: ${lastDiploma}` : ""}
        </Text>
      </div>
    </label>
  );
}

// ─── Candidate diff ────────────────────────────────────────────────────────
//
// Per-field comparison between pasted CSV row and existing profile.
// Each field is one row: label, value, ✓ or warning. Mismatches show
// the pasted value next to the candidate's value so the operator can
// eyeball the difference without glancing back at the "Geplakt:" line
// above.

type DiffField = {
  label: string;
  pasted: string;
  candidate: string;
  match: boolean;
  note?: string;
};

function computeDiff(
  pasted: ParsedPersonRow,
  cand: CandidateMatch,
): DiffField[] {
  const norm = (s: string | null | undefined) =>
    (s ?? "").trim().toLowerCase();
  const pastedFullName = [pasted.firstName, pasted.lastNamePrefix, pasted.lastName]
    .filter(Boolean)
    .join(" ");
  const candFullName = [cand.firstName, cand.lastNamePrefix, cand.lastName]
    .filter(Boolean)
    .join(" ");
  const pastedDob = pasted.dateOfBirth
    ? dayjs(pasted.dateOfBirth).format("DD-MM-YYYY")
    : "";
  const candDob = cand.dateOfBirth
    ? dayjs(cand.dateOfBirth).format("DD-MM-YYYY")
    : "";

  let dobNote: string | undefined;
  if (
    pasted.dateOfBirth &&
    cand.dateOfBirth &&
    norm(pastedDob) !== norm(candDob)
  ) {
    // Format both as YYYY-MM-DD strings so dayjs parses them at the same
    // local-midnight reference — diffing a Date (parsed in local TZ)
    // against a YYYY-MM-DD string (parsed at local midnight) leaves a
    // sub-24h gap that truncates to 0 days.
    const pastedYmd = dayjs(pasted.dateOfBirth).format("YYYY-MM-DD");
    const candYmd = dayjs(cand.dateOfBirth).format("YYYY-MM-DD");
    const diffDays = Math.abs(
      dayjs(pastedYmd).diff(dayjs(candYmd), "day"),
    );
    if (diffDays === 1) dobNote = "1 dag verschil";
    else if (diffDays <= 7) dobNote = `${diffDays} dagen verschil`;
    else if (diffDays <= 365)
      dobNote = `${Math.round(diffDays / 30)} maand(en) verschil`;
  }

  return [
    {
      label: "Naam",
      pasted: pastedFullName || "—",
      candidate: candFullName || "—",
      match: norm(pastedFullName) === norm(candFullName),
    },
    {
      label: "Geboortedatum",
      pasted: pastedDob || "—",
      candidate: candDob || "—",
      match: norm(pastedDob) === norm(candDob) && pastedDob !== "",
      note: dobNote,
    },
    {
      label: "Geboorteplaats",
      pasted: pasted.birthCity || "—",
      candidate: cand.birthCity || "—",
      match:
        norm(pasted.birthCity) === norm(cand.birthCity) &&
        Boolean(pasted.birthCity || cand.birthCity),
    },
  ];
}

function CandidateDiff({ diff }: { diff: DiffField[] }) {
  return (
    <ul className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 text-xs">
      {diff.map((f) => (
        <li key={f.label} className="contents">
          <span className="text-zinc-500">{f.label}</span>
          <span
            className={
              f.match
                ? "text-zinc-700 dark:text-zinc-300"
                : "text-amber-700 dark:text-amber-400"
            }
          >
            {f.candidate}
            {!f.match ? (
              <span className="ml-1 text-zinc-500 dark:text-zinc-400">
                ⚠ jij plakte: <span className="font-medium">{f.pasted}</span>
                {f.note ? <> ({f.note})</> : null}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ─── Decision radio group ──────────────────────────────────────────────────
//
// The "Use existing X" / "Create new" radio cluster a row variant renders
// when it has options to offer. Variants pass in the candidates they want
// to surface; the primitive handles wiring radio state to the provider.

export function RowDecisionRadios({
  rowIndex,
  candidates,
  allowCreateNew = true,
  preselectStrongMatch = false,
}: {
  rowIndex: number;
  candidates: CandidateMatch[];
  allowCreateNew?: boolean;
  preselectStrongMatch?: boolean;
}) {
  const ctx = assertPreviewContext(use(BulkImportPreviewContext));
  const decision = ctx.state.decisions.get(rowIndex);
  const pastedRow = ctx.state.preview.parsedRows.find(
    (r) => r.rowIndex === rowIndex,
  );

  const selectedPersonId =
    decision?.kind === "use_existing" ? decision.personId : null;
  const isCreateNew = decision?.kind === "create_new";

  // Auto-preselect "use existing" for strong-match single rows on first
  // render if the operator hasn't chosen yet.
  if (
    preselectStrongMatch &&
    !decision &&
    candidates.length === 1 &&
    candidates[0] &&
    candidates[0].score >= 150 &&
    candidates[0].score < 200
  ) {
    ctx.actions.setRowDecision(rowIndex, {
      kind: "use_existing",
      personId: candidates[0].personId,
    });
  }

  return (
    <div className="space-y-2">
      {candidates.map((c) => (
        <RowCandidate
          key={c.personId}
          candidate={c}
          pastedRow={pastedRow}
          selected={selectedPersonId === c.personId}
          onSelect={() =>
            ctx.actions.setRowDecision(rowIndex, {
              kind: "use_existing",
              personId: c.personId,
            })
          }
        />
      ))}
      {allowCreateNew ? (
        <label
          className={
            "flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors " +
            (isCreateNew
              ? "border-branding-dark bg-branding-light/5"
              : "border-zinc-950/10 hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-zinc-800/50")
          }
        >
          <input
            type="radio"
            checked={isCreateNew}
            onChange={() =>
              ctx.actions.setRowDecision(rowIndex, { kind: "create_new" })
            }
            className="size-4 shrink-0 accent-branding-dark"
          />
          <span className="text-sm font-medium text-zinc-950 dark:text-white">
            {candidates.length === 0
              ? "Nieuw profiel aanmaken"
              : "Geen van deze — maak nieuw profiel"}
          </span>
        </label>
      ) : null}
    </div>
  );
}
