"use client";

import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import type {
  listCohortsForLocation,
  listCompetencyProgressInCohortForStudent,
} from "~/lib/nwd";
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
  moveStudentAllocation,
}: {
  cohortId: string;
  studentAllocationId: string;
  locationId: string;
  personId: string;

  moveStudentAllocation: {
    cohorts: Awaited<ReturnType<typeof listCohortsForLocation>>;
    curriculumId?: string;
    gearTypeId?: string;
    progress: Awaited<
      ReturnType<typeof listCompetencyProgressInCohortForStudent>
    >;
  } | null;
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
          {moveStudentAllocation ? (
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

      {moveStudentAllocation ? (
        <MoveStudentAllocationDialog
          cohortId={cohortId}
          studentAllocationId={studentAllocationId}
          locationId={locationId}
          personId={personId}
          cohorts={moveStudentAllocation.cohorts}
          curriculumId={moveStudentAllocation.curriculumId}
          gearTypeId={moveStudentAllocation.gearTypeId}
          progress={moveStudentAllocation.progress}
          isOpen={openDialog === "move-student"}
          setIsOpen={(value) => setOpenDialog(value ? "move-student" : null)}
        />
      ) : null}
    </>
  );
}
