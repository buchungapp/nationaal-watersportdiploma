"use client";

import useSWR from "swr";
import PersonenBulkDialog from "../../../../personen/_components/create-bulk-dialog";
import { listCountries } from "../_actions/fetch";

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
// Country list is fetched here via SWR (the personen variant gets it
// from the parent server component; cohort variant doesn't have that
// shape so we fetch client-side).

interface Props {
  locationId: string;
  cohortId: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export default function CreateBulkDialog({
  locationId,
  cohortId,
  isOpen,
  setIsOpen,
}: Props) {
  const { data: countries } = useSWR("countries", listCountries);

  if (!countries) {
    return null;
  }

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
