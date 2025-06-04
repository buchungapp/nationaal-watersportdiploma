"use client";

import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid";
import type { User } from "@nawadi/core";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";

export function PersonActions({
  person,
}: { person: User.Person.$schema.Person }) {
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
          <DropdownItem onClick={() => {}}>
            <DropdownLabel>Maak hoofdprofiel</DropdownLabel>
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
