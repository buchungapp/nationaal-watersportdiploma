"use client";

import PersonenBulkDialog from "../../../../personen/_components/create-bulk-dialog";

// Cohort-side bulk-import dialog. Thin wrapper around the personen-page
// dialog with cohort-specific props:
//
//   - targetCohortId set → preview surfaces "already-in-cohort" rows
//     and commit creates cohort_allocation rows alongside the people
//   - fixedRoles=["student"] → cohort context only adds students,
//     skip the role picker
//   - enableTags=true → operator can map N CSV columns to "Tag" and
//     those values land on each cohort_allocation
//
// Countries arrive as a prop from the server component
// (dialog-context.tsx) — no client-side SWR waterfall.

interface Props {
  locationId: string;
  cohortId: string;
  countries: { code: string; name: string }[];
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export default function CreateBulkDialog({
  locationId,
  cohortId,
  countries,
  isOpen,
  setIsOpen,
}: Props) {
  return (
    <PersonenBulkDialog
      locationId={locationId}
      countries={countries}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      targetCohortId={cohortId}
      fixedRoles={["student"]}
      enableTags
      dialogTitle="Cursisten toevoegen aan cohort (bulk)"
      successToast={(n) =>
        `${n} ${n === 1 ? "cursist toegevoegd" : "cursisten toegevoegd"} aan dit cohort.`
      }
    />
  );
}
