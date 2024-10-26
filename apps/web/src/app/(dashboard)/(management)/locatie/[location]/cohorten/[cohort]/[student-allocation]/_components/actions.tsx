"use client";

import { XMarkIcon } from "@heroicons/react/16/solid";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  DropdownDescription,
  DropdownItem,
  DropdownLabel,
} from "~/app/(dashboard)/_components/dropdown";
import {
  addStudentToCohortByPersonId,
  claimStudents,
  releaseStudent,
  releaseStudentFromCohortByAllocationId,
  withdrawStudentFromCurriculum,
} from "../../(overview)/_actions/nwd";

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

export function StartExtraProgramForStudentAllocation({
  cohortId,
  personId,
  locationId,
}: {
  cohortId: string;
  personId: string;
  locationId: string;
}) {
  const router = useRouter();
  const params = useParams();

  return (
    <DropdownItem
      onClick={async () => {
        try {
          const { id: allocationId } = await addStudentToCohortByPersonId({
            personId,
            cohortId,
            locationId,
          });

          // We create a new allocation, so we redirect to the new allocation
          router.push(
            `/locatie/${params.location as string}/cohorten/${params.cohort as string}/${allocationId}`,
          );
          toast.success("Cursist gedupliceerd");
        } catch (error) {
          toast.error("Er is iets misgegaan");
        }
      }}
    >
      <DropdownLabel>Start extra programma</DropdownLabel>
    </DropdownItem>
  );
}

export function ReleaseStudentAllocation({
  cohortId,
  studentAllocationId,
  locationId,
}: {
  cohortId: string;
  studentAllocationId: string;
  locationId: string;
}) {
  const router = useRouter();
  const params = useParams();

  return (
    <DropdownItem
      onClick={async () => {
        try {
          await releaseStudentFromCohortByAllocationId({
            allocationId: studentAllocationId,
            cohortId,
            locationId,
          });

          // We deleted the allocation, so the page does not exist anymore
          // We need to redirect to the cohort overview
          router.push(
            `/locatie/${params.location as string}/cohorten/${params.cohort as string}`,
          );
          toast.success("Cursist verwijderd");
        } catch (error) {
          toast.error("Er is iets misgegaan");
        }
      }}
    >
      <DropdownLabel>Verwijder uit cohort</DropdownLabel>
    </DropdownItem>
  );
}

export function WithdrawStudentCurriculum({
  studentAllocationId,
  disabled,
}: {
  cohortId: string;
  studentAllocationId: string;
  locationId: string;
  disabled?: boolean;
}) {
  return (
    <DropdownItem
      disabled={disabled}
      onClick={async () => {
        try {
          await withdrawStudentFromCurriculum({
            allocationId: studentAllocationId,
          });
        } catch (error) {
          toast.error("Er is iets misgegaan");
        }
      }}
    >
      <DropdownLabel>Verwijder programma</DropdownLabel>
      <DropdownDescription>
        Verwijder eerst alle behaalde voortgang.
      </DropdownDescription>
    </DropdownItem>
  );
}
