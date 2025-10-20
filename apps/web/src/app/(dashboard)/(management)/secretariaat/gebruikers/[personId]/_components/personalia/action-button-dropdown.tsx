"use client";

import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";

import {
  ArrowTopRightOnSquareIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  PencilIcon,
  UsersIcon,
} from "@heroicons/react/16/solid";
import type { User } from "@nawadi/core";
import { useState } from "react";
import type { listCountries } from "~/lib/nwd";
import { ChangeEmail } from "./dialogs/change-email-dialog";
import { EditPersonaliaDialog } from "./dialogs/edit-personalia-dialog";

export function ActionButtonDropdown({
  person,
  countries,
}: {
  person: User.Person.$schema.Person;
  countries: Awaited<ReturnType<typeof listCountries>>;
}) {
  const [openDialog, setOpenDialog] = useState<
    "edit-personalia" | "change-email" | "merge-persons" | null
  >(null);

  return (
    <>
      <Dropdown>
        <DropdownButton color="branding-light" className="-my-1.5">
          <EllipsisVerticalIcon />
          Bewerken
        </DropdownButton>
        <DropdownMenu anchor="top end">
          <DropdownItem onClick={() => setOpenDialog("edit-personalia")}>
            <PencilIcon />
            <DropdownLabel>Personalia bewerken</DropdownLabel>
          </DropdownItem>
          <DropdownItem onClick={() => setOpenDialog("change-email")}>
            <EnvelopeIcon />
            <DropdownLabel>E-mailadres bewerken</DropdownLabel>
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem
            href={`/secretariaat/gebruikers/samenvoegen?primaryPerson=${person.id}`}
          >
            <UsersIcon />
            <DropdownLabel>Personen samenvoegen</DropdownLabel>
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem
            href={`/secretariaat/gebruikers/accounts/${person.userId}`}
            target="_blank"
          >
            <ArrowTopRightOnSquareIcon />
            <DropdownLabel>Account</DropdownLabel>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <EditPersonaliaDialog
        person={person}
        countries={countries}
        open={openDialog === "edit-personalia"}
        onClose={() => setOpenDialog(null)}
      />
      <ChangeEmail
        personId={person.id}
        open={openDialog === "change-email"}
        onClose={() => setOpenDialog(null)}
      />
    </>
  );
}
