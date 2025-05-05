import { type FormEventHandler, useCallback, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "~/app/(dashboard)/_components/button";

import { useAction } from "next-safe-action/hooks";
import { ReactTags, type Tag } from "react-tag-autocomplete";
import { assignInstructorToStudentInCohortAction } from "~/actions/cohort/student/assign-instructor-to-student-in-cohort-action";
import { claimStudentsInCohortAction } from "~/actions/cohort/student/claim-students-in-cohort-action";
import { enrollStudentsInCurriculumInCohortAction } from "~/actions/cohort/student/enroll-students-in-curriculum-in-cohort-action";
import { releaseStudentsInCohortAction } from "~/actions/cohort/student/release-students-in-cohort-action";
import { updateStudentTagsInCohortAction } from "~/actions/cohort/student/update-student-tags-in-cohort-action";
import { useFormInput } from "~/actions/hooks/useFormInput";
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
  DropdownItem,
  DropdownLabel,
} from "~/app/(dashboard)/_components/dropdown";
import { Field, Label } from "~/app/(dashboard)/_components/fieldset";
import {
  Listbox,
  ListboxLabel,
  ListboxOption,
} from "~/app/(dashboard)/_components/listbox";
import { TableSelectionButton } from "~/app/(dashboard)/_components/table-action";
import Spinner from "~/app/_components/spinner";
import {
  isInstructorInCohort,
  listCurriculaByProgram,
  listDistinctTagsForCohort,
  listGearTypesByCurriculum,
  listInstructorsInCohort,
  listPrivilegesForCohort,
  listPrograms,
} from "../_actions/fetch";
import type { Student } from "./students-table";

interface Props {
  rows: {
    id: string;
    instructor: Student["instructor"];
    studentCurriculum: Student["studentCurriculum"];
    person: Student["person"];
    tags: Student["tags"];
  }[];
  cohortId: string;
  locationRoles: ("student" | "instructor" | "location_admin")[];
}

function Claim({ rows, cohortId }: Props) {
  const { data: isInstructor } = useSWR(
    ["isInstructorInCohort", cohortId],
    () => isInstructorInCohort(cohortId),
  );

  const doAllSelectedRowsBelongToThisInstructor =
    !!isInstructor &&
    rows.every((row) => row.instructor?.id === isInstructor.personId);

  return (
    <DropdownItem
      onClick={async () => {
        try {
          if (doAllSelectedRowsBelongToThisInstructor) {
            await releaseStudentsInCohortAction(
              cohortId,
              rows.map((row) => row.id),
            );
            toast.success("Cursisten vrijgegeven");
          } else {
            await claimStudentsInCohortAction(
              cohortId,
              rows.map((row) => row.id),
            );
            toast.success("Cursisten toegekent");
          }
        } catch (error) {
          toast.error("Er is iets misgegaan");
        }
      }}
      disabled={!isInstructor}
      title={!isInstructor ? "Je bent geen instructeur in dit cohort" : ""}
    >
      <DropdownLabel>
        {doAllSelectedRowsBelongToThisInstructor
          ? "Vergeef cursisten"
          : "Claim cursisten"}
      </DropdownLabel>
    </DropdownItem>
  );
}

function StartProgram({
  rows,
  openDialog,
}: Props & { openDialog: () => void }) {
  const areAllRowsUnassigned = rows.every((row) => !row.studentCurriculum);

  return (
    <>
      <DropdownItem
        onClick={openDialog}
        disabled={!areAllRowsUnassigned}
        title={
          !areAllRowsUnassigned
            ? "Sommige cursisten zijn al aan een programma gestart"
            : undefined
        }
      >
        <DropdownLabel>Start programma</DropdownLabel>
      </DropdownItem>
    </>
  );
}

function StartProgramDialog({
  rows,
  cohortId,
  isOpen,
  close,
}: Props & {
  isOpen: boolean;
  close: () => void;
}) {
  const [programQuery, setProgramQuery] = useState("");

  const closeDialog = () => {
    close();
    reset();
  };

  const { execute, input, reset } = useAction(
    enrollStudentsInCurriculumInCohortAction.bind(
      null,
      cohortId,
      rows.map((row) => ({
        allocationId: row.id,
        personId: row.person.id,
      })),
    ),
    {
      onSuccess: () => {
        toast.success("Programma's gestart");
        closeDialog();
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
        gearTypes: await listGearTypesByCurriculum(curriculum.id),
      };
    },
  );

  if (!programs) throw new Error("Data should be defined through fallback");

  return (
    <>
      <Dialog open={isOpen} onClose={closeDialog} size="2xl">
        <DialogTitle>Start programma</DialogTitle>
        <form action={execute}>
          <DialogBody>
            {/* Hidden input for curriculumId */}
            <input
              type="hidden"
              name="curriculumId"
              value={
                activeCurriculumForProgram?.curriculum?.id ??
                getInputValue("curriculumId")
              }
            />
            <div className="gap-x-4 gap-y-2 grid grid-cols-1 lg:grid-cols-2">
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
            </div>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={closeDialog}>
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
      {pending ? <Spinner className="text-white" /> : null}
      Starten
    </Button>
  );
}

export function ActionButtons(props: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState<string | null>(null);

  return (
    <>
      <TableSelectionButton>
        <Claim {...props} />
        <StartProgram
          {...props}
          openDialog={() => setIsDialogOpen("start-program")}
        />
        <AssignInstructor
          {...props}
          openDialog={() => setIsDialogOpen("assign-instructor")}
        />
        <AddTag {...props} openDialog={() => setIsDialogOpen("add-tag")} />
      </TableSelectionButton>

      <StartProgramDialog
        {...props}
        isOpen={isDialogOpen === "start-program"}
        close={() => setIsDialogOpen(null)}
      />
      <AssignInstructorDialog
        {...props}
        isOpen={isDialogOpen === "assign-instructor"}
        close={() => setIsDialogOpen(null)}
      />
      <AddTagDialog
        {...props}
        isOpen={isDialogOpen === "add-tag"}
        close={() => setIsDialogOpen(null)}
      />
    </>
  );
}

function AssignInstructor({
  openDialog,
  cohortId,
  locationRoles,
}: Props & { openDialog: () => void }) {
  const { data: privileges } = useSWR(["permissionsInCohort", cohortId], () =>
    listPrivilegesForCohort(cohortId),
  );

  if (!privileges) throw new Error("Data should be defined through fallback");

  if (
    !(
      locationRoles.includes("location_admin") ||
      privileges.includes("manage_cohort_instructors")
    )
  ) {
    return null;
  }

  return (
    <>
      <DropdownItem onClick={openDialog}>
        <DropdownLabel>Instructeur toewijzen</DropdownLabel>
      </DropdownItem>
    </>
  );
}

function AssignInstructorDialog({
  rows,
  cohortId,
  isOpen,
  close,
}: Props & {
  isOpen: boolean;
  close: () => void;
}) {
  const [instructorQuery, setInstructorQuery] = useState("");

  const closeDialog = () => {
    close();
    reset();
  };

  const { execute, input, reset } = useAction(
    assignInstructorToStudentInCohortAction.bind(
      null,
      cohortId,
      rows.map((row) => row.id),
    ),
    {
      onSuccess: () => {
        toast.success("Instructeur gewijzigd");
        closeDialog();
      },
      onError: () => {
        toast.error("Er is iets misgegaan");
      },
    },
  );

  const { getInputValue } = useFormInput(input);

  const { data: instructors } = useSWR(
    ["allInstructorsInCohort", cohortId],
    () => listInstructorsInCohort(cohortId),
  );

  if (!instructors) throw new Error("Data should be defined through fallback");

  return (
    <>
      <Dialog open={isOpen} onClose={closeDialog} size="md">
        <DialogTitle>Instructeur toewijzen</DialogTitle>
        <DialogDescription>
          Laat leeg om de instructeur te verwijderen.
        </DialogDescription>
        <form action={execute}>
          <DialogBody>
            <Field>
              {/* TODO: this combobox is temporary used should be from catalyst */}
              <Combobox
                name="instructorPersonId"
                setQuery={setInstructorQuery}
                displayValue={(value: string) => {
                  const instructor = instructors.find(
                    (instructor) => instructor.person.id === value,
                  );

                  if (!instructor) {
                    return "";
                  }

                  return [
                    instructor.person.firstName,
                    instructor.person.lastNamePrefix,
                    instructor.person.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ");
                }}
                defaultValue={getInputValue("instructorPersonId")}
              >
                {instructors
                  .filter(
                    ({ person: { firstName, lastNamePrefix, lastName } }) => {
                      const instructorName = [
                        firstName,
                        lastNamePrefix,
                        lastName,
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        instructorQuery.length < 1 ||
                        instructorName
                          ?.toLowerCase()
                          .includes(instructorQuery.toLowerCase())
                      );
                    },
                  )
                  .map((instructor) => (
                    <ComboboxOption
                      key={instructor.id}
                      value={instructor.person.id}
                    >
                      <ComboboxLabel>
                        {[
                          instructor.person.firstName,
                          instructor.person.lastNamePrefix,
                          instructor.person.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </ComboboxLabel>
                    </ComboboxOption>
                  ))}
              </Combobox>
            </Field>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={closeDialog}>
              Annuleren
            </Button>
            <StudentSubmitButton />
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

function StudentSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Toewijzen
    </Button>
  );
}

function AddTag({
  openDialog,
  cohortId,
  locationRoles,
}: Props & { openDialog: () => void }) {
  const { data: privileges } = useSWR(["permissionsInCohort", cohortId], () =>
    listPrivilegesForCohort(cohortId),
  );

  if (!privileges) throw new Error("Data should be defined through fallback");

  if (
    !(
      locationRoles.includes("location_admin") ||
      privileges.includes("manage_cohort_students")
    )
  ) {
    return null;
  }

  return (
    <>
      <DropdownItem onClick={openDialog}>
        <DropdownLabel>Tag toevoegen</DropdownLabel>
      </DropdownItem>
    </>
  );
}

function AddTagDialog({
  rows,
  cohortId,
  isOpen,
  close,
}: Props & {
  isOpen: boolean;
  close: () => void;
}) {
  const [tagsToAdd, setTagsToAdd] = useState<Tag[]>([]);

  const handleDelete = (index: number) => {
    setTagsToAdd(tagsToAdd.filter((_, i) => i !== index));
  };

  const handleAddition = (tag: Tag) => {
    setTagsToAdd((prevTags) => {
      return [...prevTags, tag];
    });
  };

  const closeDialog = () => {
    close();
    reset();
  };

  const toastId = useRef<string | number>(null);
  const { execute, reset } = useAction(
    updateStudentTagsInCohortAction.bind(null, cohortId),
    {
      onExecute: () => {
        toastId.current = toast.loading("Tags toevoegen");
      },
      onSuccess: () => {
        if (toastId.current) {
          toast.dismiss(toastId.current);
        }

        toast.success("Tags toegevoegd");
        closeDialog();
      },
      onError: () => {
        if (toastId.current) {
          toast.dismiss(toastId.current);
        }

        toast.error("Er is iets misgegaan");
      },
    },
  );

  const submit: FormEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();
      execute(
        rows.map((row) => {
          const distinctTags = new Set<string>([
            ...row.tags,
            ...tagsToAdd.map(({ value }) => value as string),
          ]);

          return {
            allocationId: row.id,
            tags: Array.from(distinctTags),
          };
        }),
      );
    },
    [execute, rows, tagsToAdd],
  );

  const { data: allCohortTags } = useSWR(
    ["distinctTagsForCohort", cohortId],
    () => listDistinctTagsForCohort(cohortId),
  );

  if (!allCohortTags)
    throw new Error("Data should be defined through fallback");

  return (
    <>
      <Dialog open={isOpen} onClose={closeDialog} size="md">
        <DialogTitle>Tags toevoegen</DialogTitle>
        <DialogDescription>
          Welke tag(s) wil je toevoegen aan de geselecteerde cursisten? Om een
          nieuwe tag aan te maken typ je de tag in het invoerveld en druk je op
          enter.
        </DialogDescription>
        <form onSubmit={submit}>
          <DialogBody>
            <ReactTags
              labelText={undefined}
              selected={tagsToAdd}
              suggestions={
                allCohortTags
                  .filter(
                    (tag) => !tagsToAdd.some(({ value }) => value === tag),
                  )
                  .map((tag) => ({ label: tag, value: tag })) as Tag[]
              }
              onAdd={handleAddition}
              onDelete={handleDelete}
              newOptionText="%value% toevoegen"
              placeholderText="Tag toevoegen"
              onValidate={(tag) => tag.trim().length > 0}
              allowNew
              activateFirstOption
            />
          </DialogBody>
          <DialogActions>
            <Button plain onClick={closeDialog}>
              Annuleren
            </Button>
            <TagSubmitButton />
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

function TagSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Toevoegen
    </Button>
  );
}
