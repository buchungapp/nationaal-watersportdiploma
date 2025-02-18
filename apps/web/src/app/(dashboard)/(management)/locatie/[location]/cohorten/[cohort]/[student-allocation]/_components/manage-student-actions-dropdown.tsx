"use client";

import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import type { listCohortsForLocation } from "~/lib/nwd";
import {
  MoveStudentAllocation,
  MoveStudentAllocationDialog,
  ReleaseStudentAllocation,
  StartExtraProgramForStudentAllocation,
} from "./actions";

export default function ManageStudentActionsDropdown({
  cohortId,
  studentAllocationId,
  locationId,
  personId,
  cohorts,
  canMoveStudentAllocation,
}: {
  cohortId: string;
  studentAllocationId: string;
  locationId: string;
  personId: string;
  cohorts: Awaited<ReturnType<typeof listCohortsForLocation>>;
  canMoveStudentAllocation: boolean;
}) {
  const [openDialog, setOpenDialog] = useState<"move-student" | null>(null);

  return (
    <>
      <Dropdown>
        <DropdownButton outline className="-my-1.5">
          <EllipsisHorizontalIcon />
        </DropdownButton>
        <DropdownMenu anchor="bottom end">
          <StartExtraProgramForStudentAllocation
            cohortId={cohortId}
            personId={personId}
            locationId={locationId}
          />
          <ReleaseStudentAllocation
            cohortId={cohortId}
            studentAllocationId={studentAllocationId}
            locationId={locationId}
          />
          {canMoveStudentAllocation ? (
            <>
              <DropdownDivider />
              <MoveStudentAllocation
                setIsOpen={(value) =>
                  setOpenDialog(value ? "move-student" : null)
                }
              />
            </>
          ) : null}
        </DropdownMenu>
      </Dropdown>

      {canMoveStudentAllocation ? (
        <MoveStudentAllocationDialog
          cohortId={cohortId}
          studentAllocationId={studentAllocationId}
          locationId={locationId}
          cohorts={cohorts}
          isOpen={openDialog === "move-student"}
          setIsOpen={(value) => setOpenDialog(value ? "move-student" : null)}
        />
      ) : null}
    </>
  );
}
