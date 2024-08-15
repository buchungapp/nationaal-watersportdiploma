"use client";

import { XMarkIcon } from "@heroicons/react/16/solid";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import {
  DropdownDescription,
  DropdownItem,
  DropdownLabel,
} from "~/app/(dashboard)/_components/dropdown";
import { Field, Label } from "~/app/(dashboard)/_components/fieldset";
import {
  Listbox,
  ListboxLabel,
  ListboxOption,
} from "~/app/(dashboard)/_components/listbox";
import Spinner from "~/app/_components/spinner";
import type {
  listCohortsForLocation,
  listCompetencyProgressInCohortForStudent,
} from "~/lib/nwd";
import {
  addStudentToCohortByPersonId,
  claimStudents,
  enrollStudentsInCurriculumForCohort,
  releaseStudent,
  releaseStudentFromCohortByAllocationId,
  withdrawStudentFromCurriculum,
} from "../../(overview)/_actions/nwd";
import { updateBulkCompetencyProgress } from "../_actions/progress";

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

export function MoveStudentAllocation({
  setIsOpen,
}: {
  setIsOpen: (value: boolean) => void;
}) {
  return (
    <DropdownItem onClick={() => setIsOpen(true)}>
      <DropdownLabel>Verplaatsen naar cohort</DropdownLabel>
    </DropdownItem>
  );
}

export function MoveStudentAllocationDialog({
  cohortId,
  studentAllocationId,
  locationId,
  personId,

  curriculumId,
  gearTypeId,
  progress,

  cohorts,

  isOpen,
  setIsOpen,
}: {
  cohortId: string;
  studentAllocationId: string;
  locationId: string;
  personId: string;

  curriculumId?: string;
  gearTypeId?: string;
  progress: Awaited<
    ReturnType<typeof listCompetencyProgressInCohortForStudent>
  >;

  cohorts: Awaited<ReturnType<typeof listCohortsForLocation>>;

  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const router = useRouter();
  const params = useParams();

  const [selectedCohortId, setSelectedCohortId] = useState(cohortId);

  const moveStudentAllocation = async (
    _prevState: unknown,
    formData: FormData,
  ) => {
    try {
      const newCohortId = formData.get("cohort") as string;

      const newCohort = cohorts.find((x) => x.id === newCohortId);
      if (!newCohort) {
        toast.error("Cohort niet gevonden");
        return;
      }

      const { id: allocationId } = await addStudentToCohortByPersonId({
        cohortId: newCohortId,
        locationId,
        personId,
      });

      if (curriculumId && gearTypeId) {
        await enrollStudentsInCurriculumForCohort({
          cohortId: newCohortId,
          curriculumId,
          gearTypeId,
          students: [
            {
              allocationId,
              personId,
            },
          ],
        });

        if (progress.length > 0) {
          await updateBulkCompetencyProgress({
            cohortAllocationId: allocationId,
            progressData: progress.map((p) => ({
              competencyId: p.competencyId,
              progress: Number(p.progress),
            })),
          });
        }
      }

      await releaseStudentFromCohortByAllocationId({
        allocationId: studentAllocationId,
        cohortId,
        locationId,
      });

      // We deleted the allocation, so the page does not exist anymore
      // We need to redirect to the new allocation overview
      router.push(
        `/locatie/${params.location as string}/cohorten/${newCohort.handle}/${allocationId}`,
      );
      toast.success("Cursist verplaatst");
    } catch (error) {
      console.log(error);

      toast.error("Er is iets misgegaan");
    }
  };

  const [_, formAction] = useActionState(moveStudentAllocation, undefined);

  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
      <DialogTitle>Verplaatsen naar cohort</DialogTitle>
      <DialogDescription>
        Verplaats de cursist naar een ander cohort. Het programma en de
        voortgang worden meegenomen.
      </DialogDescription>
      <form action={formAction}>
        <DialogBody>
          <Field>
            <Label>Cohort</Label>
            <Listbox
              name="cohort"
              value={selectedCohortId}
              onChange={(value) => setSelectedCohortId(value)}
            >
              {cohorts.map((cohort) => (
                <ListboxOption
                  key={cohort.id}
                  value={cohort.id}
                  disabled={cohort.id === cohortId}
                >
                  <ListboxLabel>{cohort.label}</ListboxLabel>
                </ListboxOption>
              ))}
            </Listbox>
          </Field>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setIsOpen(false)}>
            Annuleren
          </Button>
          <MoveStudentAllocationSubmitButton
            disabled={selectedCohortId === cohortId}
          />
        </DialogActions>
      </form>
    </Dialog>
  );
}

function MoveStudentAllocationSubmitButton({
  disabled,
}: {
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending || disabled} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Verplaats
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
