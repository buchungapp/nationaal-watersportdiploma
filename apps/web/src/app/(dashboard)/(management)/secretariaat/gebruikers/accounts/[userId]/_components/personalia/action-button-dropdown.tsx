"use client";

import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";

import {
  EllipsisVerticalIcon,
  EnvelopeIcon,
  PencilIcon,
} from "@heroicons/react/16/solid";
import { useState } from "react";
import type { getUserById } from "~/lib/nwd";
import { ChangeDisplayName } from "./dialogs/change-display-name-dialog";
import { ChangeEmail } from "./dialogs/change-email-dialog";

export function ActionButtonDropdown({
  user,
}: {
  user: Awaited<ReturnType<typeof getUserById>>;
}) {
  const [openDialog, setOpenDialog] = useState<
    "change-display-name" | "change-email" | null
  >(null);

  return (
    <>
      <Dropdown>
        <DropdownButton color="branding-light" className="-my-1.5">
          <EllipsisVerticalIcon />
          Bewerken
        </DropdownButton>
        <DropdownMenu anchor="top end">
          <DropdownItem onClick={() => setOpenDialog("change-display-name")}>
            <PencilIcon />
            <DropdownLabel>Naam bewerken</DropdownLabel>
          </DropdownItem>
          <DropdownItem onClick={() => setOpenDialog("change-email")}>
            <EnvelopeIcon />
            <DropdownLabel>E-mailadres bewerken</DropdownLabel>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <ChangeDisplayName
        userId={user.authUserId}
        open={openDialog === "change-display-name"}
        onClose={() => setOpenDialog(null)}
      />
      <ChangeEmail
        userId={user.authUserId}
        open={openDialog === "change-email"}
        onClose={() => setOpenDialog(null)}
      />
    </>
  );
}
