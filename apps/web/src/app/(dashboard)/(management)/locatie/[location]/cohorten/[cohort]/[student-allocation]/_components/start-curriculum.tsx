"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { enrollStudentsInCurriculumInCohortAction } from "~/app/_actions/cohort/student/enroll-students-in-curriculum-in-cohort-action";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import Spinner from "~/app/_components/spinner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Combobox,
  ComboboxLabel,
  ComboboxOption,
} from "~/app/(dashboard)/_components/combobox";
import { Field, Label } from "~/app/(dashboard)/_components/fieldset";
import {
  Listbox,
  ListboxLabel,
  ListboxOption,
} from "~/app/(dashboard)/_components/listbox";
import { Text } from "~/app/(dashboard)/_components/text";
import {
  listCurriculaByProgram,
  listGearTypesByCurriculumForLocation,
  listProgramsForLocation,
} from "../../(overview)/_actions/fetch";

export function StartStudentCurriculum({
  cohortId,
  allocationId,
  personId,
  locationId,
}: {
  cohortId: string;
  allocationId: string;
  personId: string;
  locationId: string;
}) {
  const { execute, input, result } = useAction(
    enrollStudentsInCurriculumInCohortAction.bind(null, cohortId, [
      { allocationId, personId },
    ]),
    {
      onSuccess: () => {
        toast.success("Programma gestart");
      },
      onError: () => {
        toast.error("Er is iets misgegaan");
      },
    },
  );
  const { data: programs } = useSWR(
    ["allPrograms", locationId],
    listProgramsForLocation.bind(null, locationId),
  );
  const { getInputValue } = useFormInput(input);
  const [selectedProgram, setSelectedProgram] = useState<
    NonNullable<typeof programs>[number] | null
  >(
    programs?.find(
      (program) => program.id === getInputValue("curriculum")?.id,
    ) ?? null,
  );

  const { data: activeCurriculumForProgram } = useSWR(
    ["activeCurriculumForProgram", selectedProgram],
    async () => {
      if (!selectedProgram) {
        return {
          curriculum: null,
          gearTypes: [],
        };
      }

      const [curriculum] = await listCurriculaByProgram(
        selectedProgram.id,
        true,
      );

      if (!curriculum) {
        return {
          curriculum: null,
          gearTypes: [],
        };
      }

      return {
        curriculum,
        gearTypes: await listGearTypesByCurriculumForLocation(
          locationId,
          curriculum.id,
        ),
      };
    },
  );

  if (!programs) throw new Error("Data should be defined through fallback");

  return (
    <>
      <Text className="mt-4">
        Deze cursist is nog niet toegewezen aan een programma. Selecteer een
        programma en een vaartuig om te starten. Je kan typen in de velden om
        het zoeken te vergemakkelijken.
      </Text>

      <form
        action={execute}
        className="flex lg:flex-row flex-col lg:items-end gap-y-3.5 lg:gap-x-4 mt-2.5"
      >
        {/* Hidden input for curriculumId */}
        <input
          type="hidden"
          name="curriculum[id]"
          value={
            activeCurriculumForProgram?.curriculum?.id ??
            getInputValue("curriculum")?.id ??
            ""
          }
        />

        <Field className="flex-1">
          <Label>Programma</Label>
          <Combobox
            name="program"
            options={programs}
            displayValue={(program) => {
              if (!program) return "";
              return (
                program.title ??
                `${program.course.title} ${program.degree.title}`
              );
            }}
            onChange={setSelectedProgram}
            value={selectedProgram}
            defaultValue={
              programs?.find(
                (program) => program.id === getInputValue("curriculum")?.id,
              ) ?? null
            }
            invalid={!!result?.validationErrors?.curriculum}
          >
            {(program) => {
              return (
                <ComboboxOption key={program.id} value={program}>
                  <ComboboxLabel>
                    {program.title ??
                      `${program.course.title} ${program.degree.title}`}
                  </ComboboxLabel>
                </ComboboxOption>
              );
            }}
          </Combobox>
        </Field>
        <Field className="flex-1">
          <Label>Vaartuig</Label>
          <Listbox
            name="gearType[id]"
            disabled={
              !(selectedProgram && !!activeCurriculumForProgram?.curriculum)
            }
            defaultValue={getInputValue("gearType")?.id}
            invalid={!!result?.validationErrors?.gearType}
          >
            {activeCurriculumForProgram?.gearTypes.map((gearType) => (
              <ListboxOption key={gearType.id} value={gearType.id}>
                <ListboxLabel>{gearType.title}</ListboxLabel>
              </ListboxOption>
            ))}
          </Listbox>
        </Field>

        <div className="shrink-0">
          <ProgramSubmitButton />
        </div>
      </form>
    </>
  );
}

function ProgramSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Starten
    </Button>
  );
}
