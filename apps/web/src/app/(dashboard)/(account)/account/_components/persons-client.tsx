"use client";

import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid";
import type { User } from "@nawadi/core";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { setPrimaryPersonForUserAction } from "~/app/_actions/user/set-primary-person-action";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";

export function PersonActions({
  person,
}: {
  person: User.Person.$schema.Person;
}) {
  const { execute } = useAction(setPrimaryPersonForUserAction, {
    onSuccess: () => {
      toast.success("Hoofdprofiel bijgewerkt!");
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Er is een fout opgetreden");
    },
  });

  return (
    <Dropdown>
      <DropdownButton outline className="-my-1.5 bg-white">
        <EllipsisHorizontalIcon />
      </DropdownButton>
      <DropdownMenu anchor="bottom end">
        <DropdownItem href={`/profiel/${person.handle}`}>
          <DropdownLabel>Open profiel</DropdownLabel>
        </DropdownItem>
        {!person.isPrimary && (
          <DropdownItem
            onClick={() => {
              execute({
                personId: person.id,
              });
            }}
          >
            <DropdownLabel>Maak hoofdprofiel</DropdownLabel>
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
