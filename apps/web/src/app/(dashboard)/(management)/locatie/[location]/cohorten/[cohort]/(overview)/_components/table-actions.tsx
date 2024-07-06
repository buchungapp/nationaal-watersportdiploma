import { ChevronDownIcon } from "@heroicons/react/16/solid";
import type { Row } from "@tanstack/react-table";
import { useState } from "react";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "~/app/(dashboard)/_components/button";

import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Combobox,
  ComboboxLabel,
  ComboboxOption,
} from "~/app/(dashboard)/_components/combobox";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import { Field, Label } from "~/app/(dashboard)/_components/fieldset";
import {
  Listbox,
  ListboxLabel,
  ListboxOption,
} from "~/app/(dashboard)/_components/listbox";

import {
  claimStudentsInCohort,
  enrollStudentsInCurriculumForCohort,
  isInstructorInCohort,
  listCurriculaByProgram,
  listGearTypesByCurriculum,
  listPrograms,
} from "../_actions/nwd";
import { Student } from "./students-table";

type Props = { rows: Row<Student>[]; cohortId: string };

function Claim({ rows, cohortId }: Props) {
  const { data: isInstructor } = useSWR("isInstructor", () =>
    isInstructorInCohort(cohortId),
  );

  return (
    <DropdownItem
      onClick={async () => {
        await claimStudentsInCohort(
          cohortId,
          rows.map((row) => row.original.id),
        )
          .then(() => toast("Cursisten geclaimd"))
          .catch(() => toast.error("Er is iets misgegaan"));
      }}
      disabled={!isInstructor}
      title={!isInstructor ? "Je bent geen instructeur in dit cohort" : ""}
    >
      Claim cursisten
    </DropdownItem>
  );
}

function StartProgram({
  rows,
  openDialog,
}: Props & { openDialog: () => void }) {
  const areAllRowsUnassigned = rows.every(
    (row) => !row.original.studentCurriculum,
  );

  return (
    <>
      <DropdownItem
        onClick={openDialog}
        disabled={!areAllRowsUnassigned}
        title={
          !areAllRowsUnassigned
            ? "Sommige cursisten zijn al aan een programma gestart"
            : ""
        }
      >
        Start programma
      </DropdownItem>
    </>
  );
}

function StartProgramDialog({
  rows,
  cohortId,
  isOpen,
  setIsOpen,
}: Props & {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const router = useRouter();

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
        students: rows.map((row) => ({
          allocationId: row.original.id,
          personId: row.original.person.id,
        })),
      });

      router.refresh();
      toast.success("Programma's gestart");
      setIsOpen(false);
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
      <Dialog open={isOpen} onClose={setIsOpen} size="2xl">
        <DialogTitle>Start programma</DialogTitle>
        <form action={formAction}>
          <DialogBody>
            {/* Hidden input for curriculumId */}
            <input
              type="hidden"
              name="curriculumId"
              value={activeCurriculumForProgram?.curriculum?.id ?? ""}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-2">
              <Field>
                <Label>Programma</Label>
                {/* TODO: this combobox is temporary used should be from catalyst */}
                <Combobox
                  name="program"
                  setQuery={setProgramQuery}
                  displayValue={(value: string) => {
                    const program = programs.find(
                      (program) => program.id === value,
                    );

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
              <Field>
                <Label>Vaartuig</Label>
                <Listbox
                  name="gearTypeId"
                  disabled={
                    !(
                      selectedProgram &&
                      !!activeCurriculumForProgram?.curriculum
                    )
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
            </div>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={() => setIsOpen(false)}>
              Annuleren
            </Button>
            <ProgramSubmitButton />
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

function ProgramSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      Starten
    </Button>
  );
}

export function ActionButtons(props: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState<string | null>(null);

  return (
    <>
      <Dropdown>
        <DropdownButton aria-label="Acties" className="!absolute left-12 top-0">
          Acties <ChevronDownIcon />
        </DropdownButton>
        <DropdownMenu anchor="bottom start">
          <Claim {...props} />
          <StartProgram
            {...props}
            openDialog={() => setIsDialogOpen("start-program")}
          />
        </DropdownMenu>
      </Dropdown>

      <StartProgramDialog
        {...props}
        isOpen={isDialogOpen === "start-program"}
        setIsOpen={(value) => setIsDialogOpen(value ? "start-program" : null)}
      />
    </>
  );
}
