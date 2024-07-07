"use client";

import { XMarkIcon } from "@heroicons/react/16/solid";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import { claimStudents, releaseStudent } from "../../(overview)/_actions/nwd";

export function ClaimInstructorAllocation({
  cohortId,
  studentAllocationId,
}: {
  cohortId: string;
  studentAllocationId: string;
}) {
  return (
    <Button
      outline
      className="shrink-0"
      onClick={async () => {
        await claimStudents(cohortId, [studentAllocationId])
          .then(() => toast.success("Cursist toegekent"))
          .catch(() => toast.error("Er is iets misgegaan"));
      }}
    >
      Claim
    </Button>
  );
}

export function ReleaseInstructorAllocation({
  cohortId,
  studentAllocationId,
}: {
  cohortId: string;
  studentAllocationId: string;
}) {
  return (
    <Button
      plain
      className="shrink-0"
      onClick={async () => {
        await releaseStudent(cohortId, [studentAllocationId])
          .then(() => toast.success("Cursist vrijgegeven"))
          .catch(() => toast.error("Er is iets misgegaan"));
      }}
    >
      <XMarkIcon />
    </Button>
  );
}
