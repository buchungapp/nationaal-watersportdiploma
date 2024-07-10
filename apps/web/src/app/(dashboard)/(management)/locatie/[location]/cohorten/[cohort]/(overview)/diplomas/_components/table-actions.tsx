import { ChevronDownIcon } from "@heroicons/react/16/solid";
import type { Row } from "@tanstack/react-table";
import { useState } from "react";

import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";

import type { Student } from "./students-table";

interface Props {
  rows: Row<Student>[];
  cohortId: string;
  locationRoles: ("student" | "instructor" | "location_admin")[];
}

export function ActionButtons(props: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState<string | null>(null);

  return (
    <>
      <Dropdown>
        <DropdownButton aria-label="Acties" className="!absolute left-12 top-0">
          Acties <ChevronDownIcon />
        </DropdownButton>
        <DropdownMenu anchor="bottom start"></DropdownMenu>
      </Dropdown>
    </>
  );
}
