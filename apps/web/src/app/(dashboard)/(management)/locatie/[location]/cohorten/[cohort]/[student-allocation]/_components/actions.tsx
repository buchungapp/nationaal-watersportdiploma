"use client";

import { XMarkIcon } from "@heroicons/react/16/solid";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Combobox,
  ComboboxLabel,
  ComboboxOption,
} from "~/app/(dashboard)/_components/combobox";
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
import Spinner from "~/app/_components/spinner";
import type { listCohortsForLocation } from "~/lib/nwd";
import {
  addStudentToCohortByPersonId,
  claimStudents,
  moveAllocationById,
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

  cohorts,

  isOpen,
  setIsOpen,
}: {
  cohortId: string;
  studentAllocationId: string;
  locationId: string;

  cohorts: Awaited<ReturnType<typeof listCohortsForLocation>>;

  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const router = useRouter();
  const params = useParams();

  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const [cohortQuery, setCohortQuery] = useState("");

  const filteredCohorts =
    cohortQuery === ""
      ? cohorts
      : cohorts.filter((cohort) => {
          return cohort.label.toLowerCase().includes(cohortQuery.toLowerCase());
        });

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

      const { id: newAllocationId } = await moveAllocationById({
        locationId,
        allocationId: studentAllocationId,
        cohortId,
        newCohortId,
      });

      // We deleted the allocation, so the page does not exist anymore
      // We need to redirect to the new allocation overview
      router.replace(
        `/locatie/${params.location as string}/cohorten/${newCohort.handle}/${newAllocationId}`,
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
            <Combobox
              name="cohort"
              value={selectedCohortId}
              onChange={(value) => setSelectedCohortId(value)}
              setQuery={setCohortQuery}
              displayValue={(value) =>
                cohorts.find((x) => x.id === value)?.label ?? ""
              }
              placeholder="Selecteer een cohort"
            >
              {filteredCohorts.map((cohort) => (
                <ComboboxOption
                  key={cohort.id}
                  value={cohort.id}
                  disabled={cohort.id === cohortId}
                >
                  <ComboboxLabel>{cohort.label}</ComboboxLabel>
                </ComboboxOption>
              ))}
            </Combobox>
          </Field>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setIsOpen(false)}>
            Annuleren
          </Button>
          <MoveStudentAllocationSubmitButton
            disabled={
              selectedCohortId === cohortId || selectedCohortId === null
            }
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
