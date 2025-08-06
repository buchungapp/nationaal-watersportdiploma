"use client";

import { TrashIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import type { Program } from "~/app/(dashboard)/(account)/profiel/[handle]/_components/progress/programs";
import { useProgressCard } from "~/app/(dashboard)/(account)/profiel/[handle]/_components/progress/progress-card";
import {
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import { Dropdown } from "~/app/(dashboard)/_components/dropdown";
import { RemoveStudentCurriculumDialog } from "./dialogs/remove-student-curriculum-dialog";
import { ProgressDropdownButton } from "./progress-dropdown-button";

export function ProgramActions() {
  const { type, data: program } = useProgressCard<Program>();

  const [openDialog, setOpenDialog] = useState<
    "remove-student-curriculum" | null
  >(null);

  return (
    <>
      <Dropdown>
        <ProgressDropdownButton type={type} />
        <DropdownMenu anchor="bottom end">
          <DropdownItem
            onClick={() => setOpenDialog("remove-student-curriculum")}
          >
            <TrashIcon />
            <DropdownLabel>Programma verwijderen</DropdownLabel>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <RemoveStudentCurriculumDialog
        studentCurriculumId={program.id}
        open={openDialog === "remove-student-curriculum"}
        onClose={() => setOpenDialog(null)}
      />
    </>
  );
}
