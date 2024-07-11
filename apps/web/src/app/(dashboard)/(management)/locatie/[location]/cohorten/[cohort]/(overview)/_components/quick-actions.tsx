"use client";
import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid";
import { useState, useTransition } from "react";
import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
} from "~/app/(dashboard)/_components/alert";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import { ErrorMessage } from "~/app/(dashboard)/_components/fieldset";
import { Strong } from "~/app/(dashboard)/_components/text";
import Spinner from "~/app/_components/spinner";

interface Props {
  cohortId: string;
}

export function CohortActions(props: Props) {
  return (
    <Dropdown>
      <DropdownButton plain className="-my-1.5">
        <EllipsisHorizontalIcon />
      </DropdownButton>
      <DropdownMenu anchor="bottom end">
        <DropdownItem onClick={() => {}}>Wijzig</DropdownItem>
        <DropdownItem onClick={() => {}}>Verwijder</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}

export function RemoveCohortDialog({
  isOpen,
  cohortId,
  setIsOpen,
}: Props & {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Alert open={isOpen} onClose={setIsOpen} size="md">
      <AlertTitle>Cohort verwijderen</AlertTitle>
      <AlertDescription>
        Weet je zeker dat je dit cohort wilt verwijderen? Dit verwijdert alle
        voortgang, en kan niet ongedaan worden gemaakt.{" "}
        <Strong>Reeds uitgegeven diploma's blijven bestaan.</Strong>
      </AlertDescription>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <AlertActions>
        <Button plain onClick={() => setIsOpen(false)}>
          Annuleren
        </Button>
        <Button
          color="red"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await withDrawCertificates({
                certificateIds: rows.map((row) => row.original.certificate!.id),
                cohortId,
              })
                .then(() => setIsOpen(false))
                .catch((error) => {
                  if (error instanceof Error) {
                    return setError(error.message);
                  }
                  setError("Er is een fout opgetreden.");
                });
            });
          }}
        >
          {pending ? <Spinner /> : null} Verwijderen
        </Button>
      </AlertActions>
    </Alert>
  );
}
