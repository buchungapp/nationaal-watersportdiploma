import { useActionState, useCallback, useState, type FormEventHandler } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "~/app/(dashboard)/_components/button";

import { ReactTags, type Tag } from "react-tag-autocomplete";
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
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import { Field, Label } from "~/app/(dashboard)/_components/fieldset";
import {
  Listbox,
  ListboxLabel,
  ListboxOption,
} from "~/app/(dashboard)/_components/listbox";
import Spinner from "~/app/_components/spinner";
import {
  assignInstructorToStudents,
  claimStudents,
  enrollStudentsInCurriculumForCohort,
  isInstructorInCohort,
  listCurriculaByProgram,
  listDistinctTagsForCohort,
  listGearTypesByCurriculum,
  listInstructorsInCohort,
  listPrivilegesForCohort,
  listPrograms,
  releaseStudent,
  setTags,
} from "../_actions/nwd";
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
            await releaseStudent(
              cohortId,
              rows.map((row) => row.id),
            );
            toast.success("Cursisten vrijgegeven");
          } else {
            await claimStudents(
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
  setIsOpen,
}: Props & {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
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
        students: rows.map((row) => ({
          allocationId: row.id,
          personId: row.person.id,
        })),
      });

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
      {pending ? <Spinner className="text-white" /> : null}
      Starten
    </Button>
  );
}

export function ActionButtons(props: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState<string | null>(null);

  return (
    <>
      <Dropdown>
        <DropdownButton aria-label="Bulk actie">Bulk actie</DropdownButton>
        <DropdownMenu anchor="top">
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
        </DropdownMenu>
      </Dropdown>

      <StartProgramDialog
        {...props}
        isOpen={isDialogOpen === "start-program"}
        setIsOpen={(value) => setIsDialogOpen(value ? "start-program" : null)}
      />
      <AssignInstructorDialog
        {...props}
        isOpen={isDialogOpen === "assign-instructor"}
        setIsOpen={(value) =>
          setIsDialogOpen(value ? "assign-instructor" : null)
        }
      />
      <AddTagDialog
        {...props}
        isOpen={isDialogOpen === "add-tag"}
        setIsOpen={(value) => setIsDialogOpen(value ? "add-tag" : null)}
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
  setIsOpen,
}: Props & {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const submit = async (_prevState: unknown, formData: FormData) => {
    try {
      const instructorPersonId = z
        .string()
        .uuid()
        .nullable()
        .parse(formData.get("instructorPersonId"));

      await assignInstructorToStudents({
        cohortId,
        instructorPersonId,
        studentIds: rows.map((row) => row.id),
      });

      toast.success("Instructeur gewijzigd");
      setIsOpen(false);
    } catch (error) {
      toast.error("Er is iets misgegaan");
    }
  };

  const [instructorQuery, setInstructorQuery] = useState("");

  const [_state, formAction] = useActionState(submit, undefined);

  const { data: instructors } = useSWR(
    ["allInstructorsInCohort", cohortId],
    () => listInstructorsInCohort(cohortId),
  );

  if (!instructors) throw new Error("Data should be defined through fallback");

  return (
    <>
      <Dialog open={isOpen} onClose={setIsOpen} size="md">
        <DialogTitle>Instructeur toewijzen</DialogTitle>
        <DialogDescription>
          Laat leeg om de instructeur te verwijderen.
        </DialogDescription>
        <form action={formAction}>
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
            <Button plain onClick={() => setIsOpen(false)}>
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
  setIsOpen,
}: Props & {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
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

  const submit: FormEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();

      async function updateTags() {
        for (const row of rows) {
          const distinctTags = new Set<string>([
            ...row.tags,
            ...tagsToAdd.map(({ value }) => value as string),
          ]);

          await setTags({
            cohortId,
            allocationId: row.id,
            tags: Array.from(distinctTags),
          });
        }
      }

      toast.promise(updateTags(), {
        loading: "Tags toevoegen",
        success: "Tags toegevoegd",
        error: "Er is iets misgegaan",
      });

      setIsOpen(false);
    },
    [cohortId, rows, tagsToAdd],
  );

  const { data: allCohortTags } = useSWR(
    ["distinctTagsForCohort", cohortId],
    () => listDistinctTagsForCohort(cohortId),
  );

  if (!allCohortTags)
    throw new Error("Data should be defined through fallback");

  return (
    <>
      <Dialog open={isOpen} onClose={setIsOpen} size="md">
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
            <Button plain onClick={() => setIsOpen(false)}>
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
