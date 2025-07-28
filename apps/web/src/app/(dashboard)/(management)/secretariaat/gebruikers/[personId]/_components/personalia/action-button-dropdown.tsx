"use client";

import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";

import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid";
import type { User } from "@nawadi/core";
import { useState } from "react";
import type { listCountries } from "~/lib/nwd";
import { ChangeEmail } from "./dialogs/change-email-dialog";
import { EditPersonaliaDialog } from "./dialogs/edit-personalia-dialog";

export async function ActionButtonDropdown({
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
          <EllipsisHorizontalIcon />
        </DropdownButton>
        <DropdownMenu anchor="bottom end">
          <DropdownItem onClick={() => setOpenDialog("edit-personalia")}>
            <DropdownLabel>Personalia bewerken</DropdownLabel>
          </DropdownItem>
          <DropdownItem onClick={() => setOpenDialog("change-email")}>
            <DropdownLabel>E-mailadres bewerken</DropdownLabel>
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem onClick={() => setOpenDialog("merge-persons")}>
            <DropdownLabel>Personen samenvoegen</DropdownLabel>
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
