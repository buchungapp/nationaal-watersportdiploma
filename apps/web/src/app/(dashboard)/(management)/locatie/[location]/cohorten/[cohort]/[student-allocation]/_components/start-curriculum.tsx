"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
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

import { useAction } from "next-safe-action/hooks";
import { Text } from "~/app/(dashboard)/_components/text";
import { enrollStudentsInCurriculumInCohortAction } from "~/app/_actions/cohort/student/enroll-students-in-curriculum-in-cohort-action";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import Spinner from "~/app/_components/spinner";
import {
  listCurriculaByProgram,
  listGearTypesByCurriculumForLocation,
  listPrograms,
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
  const [programQuery, setProgramQuery] = useState("");

  const { execute, input } = useAction(
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
  const { data: programs } = useSWR("allPrograms", listPrograms);
  const { getInputValue } = useFormInput(input);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(
    programs?.find((program) => program.id === getInputValue("curriculumId"))
      ?.id ?? null,
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

      const [curriculum] = await listCurriculaByProgram(selectedProgram, true);

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
          name="curriculumId"
          value={
            activeCurriculumForProgram?.curriculum?.id ??
            getInputValue("curriculumId")
          }
        />

        <Field className="flex-1">
          <Label>Programma</Label>
          {/* TODO: this combobox is temporary used should be from catalyst */}
          <Combobox
            name="program"
            setQuery={setProgramQuery}
            displayValue={(value: string) => {
              const program = programs.find((program) => program.id === value);

              if (!program) {
                return "";
              }

              return (
                program?.title ??
                `${program?.course.title} ${program?.degree.title}`
              );
            }}
            onChange={(value: unknown) => {
              if (!(typeof value === "string" || value === null)) {
                throw new Error("Invalid value for program");
              }

              setSelectedProgram(value);
            }}
            value={selectedProgram}
            defaultValue={
              programs?.find(
                (program) => program.id === getInputValue("curriculumId"),
              )?.id ?? null
            }
            // invalid={!!state?.errors.curriculumId}
          >
            {programs
              .filter((x) => {
                const programTitle =
                  x.title ?? `${x.course.title} ${x.degree.title}`;

                return (
                  programQuery.length < 1 ||
                  programTitle
                    ?.toLowerCase()
                    .includes(programQuery.toLowerCase())
                );
              })
              .map((program) => (
                <ComboboxOption key={program.id} value={program.id}>
                  <ComboboxLabel>
                    {program.title ??
                      `${program.course.title} ${program.degree.title}`}
                  </ComboboxLabel>
                </ComboboxOption>
              ))}
          </Combobox>
        </Field>
        <Field className="flex-1">
          <Label>Vaartuig</Label>
          <Listbox
            name="gearTypeId"
            disabled={
              !(selectedProgram && !!activeCurriculumForProgram?.curriculum)
            }
            defaultValue={getInputValue("gearTypeId")}
            // invalid={!!state?.errors.gearTypeId}
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
