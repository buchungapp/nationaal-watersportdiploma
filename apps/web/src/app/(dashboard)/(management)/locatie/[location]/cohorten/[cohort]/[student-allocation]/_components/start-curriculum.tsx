"use client";

import { useState } from "react";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "~/app/(dashboard)/_components/button";

import { z } from "zod";
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
import Spinner from "~/app/_components/spinner";
import {
  enrollStudentsInCurriculumForCohort,
  listCurriculaByProgram,
  listGearTypesByCurriculum,
  listPrograms,
} from "../../(overview)/_actions/nwd";

export function StartStudentCurriculum({
  cohortId,
  allocationId,
  personId,
}: {
  cohortId: string;
  allocationId: string;
  personId: string;
}) {
  const submit = async (_prevState: unknown, formData: FormData) => {
    const programId = formData.get("program");
    const gearTypeId = formData.get("gearTypeId");
    const curriculumId = formData.get("curriculumId");

    try {
      const validated = z
        .object({
          program: z.string().uuid(),
          gearTypeId: z.string().uuid(),
          curriculumId: z.string().uuid(),
        })
        .parse({
          program: programId,
          gearTypeId: gearTypeId,
          curriculumId: curriculumId,
        });

      await enrollStudentsInCurriculumForCohort({
        cohortId,
        curriculumId: validated.curriculumId,
        gearTypeId: validated.gearTypeId,
        students: [
          {
            allocationId,
            personId,
          },
        ],
      });

      toast.success("Programma gestart");
    } catch (error) {
      toast.error("Er is iets misgegaan");
    }
  };

  const [programQuery, setProgramQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  const [_state, formAction] = useActionState(submit, undefined);

  const { data: programs } = useSWR("allPrograms", listPrograms);
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
        gearTypes: await listGearTypesByCurriculum(curriculum.id),
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
        action={formAction}
        className="mt-2.5 flex flex-col gap-y-3.5 lg:flex-row lg:gap-x-4 lg:items-end"
      >
        {/* Hidden input for curriculumId */}
        <input
          type="hidden"
          name="curriculumId"
          value={activeCurriculumForProgram?.curriculum?.id ?? ""}
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
