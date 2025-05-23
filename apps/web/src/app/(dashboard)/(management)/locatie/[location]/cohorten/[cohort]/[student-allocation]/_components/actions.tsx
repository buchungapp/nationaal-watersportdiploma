"use client";

import { XMarkIcon } from "@heroicons/react/16/solid";
import { useAction } from "next-safe-action/hooks";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Combobox,
  ComboboxLabel,
  ComboboxOption,
  ensuredFind,
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
import { addStudentToCohortAction } from "~/app/_actions/cohort/add-student-to-cohort-action";
import { moveStudentToCohortAction } from "~/app/_actions/cohort/move-student-to-cohort-action";
import { removeStudentFromCohortAction } from "~/app/_actions/cohort/remove-student-from-cohort-action";
import { claimStudentsInCohortAction } from "~/app/_actions/cohort/student/claim-students-in-cohort-action";
import { releaseStudentsInCohortAction } from "~/app/_actions/cohort/student/release-students-in-cohort-action";
import { withdrawStudentFromCurriculumInCohortAction } from "~/app/_actions/cohort/student/withdraw-student-from-curriculum-in-cohort-action";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
import type { listCohortsForLocation } from "~/lib/nwd";

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
        await claimStudentsInCohortAction(cohortId, [studentAllocationId])
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
      onClick={() =>
        releaseStudentsInCohortAction(cohortId, [studentAllocationId])
          .then(() => toast.success("Cursist vrijgegeven"))
          .catch(() => toast.error("Er is iets misgegaan"))
      }
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
  close,
}: {
  cohortId: string;
  studentAllocationId: string;
  locationId: string;

  cohorts: Awaited<ReturnType<typeof listCohortsForLocation>>;

  isOpen: boolean;
  close: () => void;
}) {
  const closeDialog = () => {
    close();
    reset();
  };

  const router = useRouter();
  const params = useParams();

  const { execute, input, reset } = useAction(
    moveStudentToCohortAction.bind(
      null,
      locationId,
      cohortId,
      studentAllocationId,
    ),
    {
      onSuccess: ({ data }) => {
        if (!data) {
          toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
          return;
        }

        router.replace(
          `/locatie/${params.location as string}/cohorten/${data.cohort.handle}/${data.allocation.id}`,
        );
        toast.success("Cursist verplaatst");
      },
      onError: () => {
        toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  const { getInputValue } = useFormInput(input);

  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(
    getInputValue("cohortId") ?? null,
  );

  return (
    <Dialog open={isOpen} onClose={closeDialog}>
      <DialogTitle>Verplaatsen naar cohort</DialogTitle>
      <DialogDescription>
        Verplaats de cursist naar een ander cohort. Het programma en de
        voortgang worden meegenomen.
      </DialogDescription>
      <form action={execute}>
        <DialogBody>
          <Field>
            <Label>Cohort</Label>
            <Combobox
              name="cohortId"
              options={cohorts.map((cohort) => cohort.id)}
              value={selectedCohortId}
              defaultValue={getInputValue("cohortId")}
              onChange={setSelectedCohortId}
              displayValue={(value) =>
                ensuredFind(cohorts, (cohort) => cohort.id === value).label
              }
              placeholder="Selecteer een cohort"
            >
              {(renderCohortId) => (
                <ComboboxOption
                  key={renderCohortId}
                  value={renderCohortId}
                  disabled={renderCohortId === cohortId}
                >
                  <ComboboxLabel>
                    {
                      ensuredFind(
                        cohorts,
                        (cohort) => cohort.id === renderCohortId,
                      ).label
                    }
                  </ComboboxLabel>
                </ComboboxOption>
              )}
            </Combobox>
          </Field>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={closeDialog}>
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
      onClick={() =>
        addStudentToCohortAction(locationId, cohortId, {
          person: { id: personId },
        })
          .then((result) => {
            if (!result?.data) {
              toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
              return;
            }

            // We create a new allocation, so we redirect to the new allocation
            router.push(
              `/locatie/${params.location as string}/cohorten/${params.cohort as string}/${result.data.allocation.id}`,
            );
            toast.success("Cursist gedupliceerd");
          })
          .catch(() => {
            toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
          })
      }
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
      onClick={() =>
        removeStudentFromCohortAction(locationId, cohortId, studentAllocationId)
          .then(() => {
            router.push(
              `/locatie/${params.location as string}/cohorten/${params.cohort as string}`,
            );
            toast.success("Cursist verwijderd");
          })
          .catch(() => {
            toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
          })
      }
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
      onClick={() =>
        withdrawStudentFromCurriculumInCohortAction(studentAllocationId).catch(
          () => {
            toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
          },
        )
      }
    >
      <DropdownLabel>Verwijder programma</DropdownLabel>
      <DropdownDescription>
        Verwijder eerst alle behaalde voortgang.
      </DropdownDescription>
    </DropdownItem>
  );
}
