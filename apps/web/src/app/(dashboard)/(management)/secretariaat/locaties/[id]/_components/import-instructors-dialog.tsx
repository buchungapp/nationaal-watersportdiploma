"use client";

import PersonenBulkDialog from "~/app/(dashboard)/(management)/locatie/[location]/personen/_components/create-bulk-dialog";

interface Props {
  locationId: string;
  countries: { code: string; name: string }[];
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export function ImportInstructorsDialog({
  locationId,
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
      fixedRoles={["instructor"]}
      authVariant="secretariat"
      dialogTitle="Instructeurs importeren (bulk)"
      successToast={(n) =>
        `${n} ${n === 1 ? "instructeur toegevoegd" : "instructeurs toegevoegd"}.`
      }
    />
  );
}
