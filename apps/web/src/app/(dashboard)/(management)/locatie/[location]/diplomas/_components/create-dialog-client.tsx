"use client";
import * as Headless from "@headlessui/react";
import { PlusIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
  CheckboxGroup,
} from "~/app/(dashboard)/_components/checkbox";
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
  Field,
  FieldGroup,
  Fieldset,
  Label,
  Legend,
} from "~/app/(dashboard)/_components/fieldset";
import {
  Listbox,
  ListboxLabel,
  ListboxOption,
} from "~/app/(dashboard)/_components/listbox";
import { Text } from "~/app/(dashboard)/_components/text";
import Spinner from "~/app/_components/spinner";
import dayjs from "~/lib/dayjs";
import type {
  listCurriculaByProgram,
  listGearTypesByCurriculum,
  listPersonsForLocationByRole,
  listPrograms,
} from "~/lib/nwd";
import { createCertificate } from "../_actions/create";
import {
  getCompletedCompetencies,
  getCurriculaByProgram,
  getGearTypesByCurriculum,
} from "../_actions/fetch";

interface Props {
  locationId: string;
  persons: Awaited<ReturnType<typeof listPersonsForLocationByRole>>;
  programs: Awaited<ReturnType<typeof listPrograms>>;
}

export default function Wrapper(props: Props) {
  const forceRerenderId = useRef(0);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CreateDialogClient
      key={String(forceRerenderId.current)}
      {...props}
      isOpen={isOpen}
      setIsOpen={(next) => {
        setIsOpen(next);
        forceRerenderId.current += 1;
      }}
    />
  );
}

function CreateDialogClient({
  locationId,
  persons,
  programs,
  isOpen,
  setIsOpen,
}: Props & { isOpen: boolean; setIsOpen: (value: boolean) => void }) {
  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await createCertificate(
      locationId,
      selectedCurriculum?.id ?? "",
      prevState,
      formData,
    );

    if (result.message === "Success") {
      toast.success("Diploma toegevoegd");
      setIsOpen(false);
    }

    if (result.message === "Error" && Object.keys(result.errors).length < 1) {
      toast.error("Er is iets misgegaan");
    }

    return result;
  };

  const [state, formAction] = useActionState(submit, undefined);

  const [selectedPerson, setSelectedPerson] = useState<
    (typeof persons)[number] | null
  >(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedGearType, setSelectedGearType] = useState<string | null>(null);
  const [selectedCurriculum, setSelectedCurriculum] = useState<
    Awaited<ReturnType<typeof listCurriculaByProgram>>[number] | null
  >(null);
  const [completedCompetencies, setCompletedCompetencies] = useState<Awaited<
    ReturnType<typeof getCompletedCompetencies>
  > | null>(null);

  const [programQuery, setProgramQuery] = useState("");
  const [personQuery, setPersonQuery] = useState("");
  // const deferredPersonQuery = useDeferredValue(personQuery);

  const filteredPersons = persons.filter(
    (x) =>
      personQuery.length < 1 ||
      [x.firstName, x.lastNamePrefix, x.lastName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(personQuery.toLowerCase()),
  );

  const [gearTypes, setGearTypes] = useState<
    Awaited<ReturnType<typeof listGearTypesByCurriculum>>
  >([]);

  useEffect(() => {
    async function fetchCurricula() {
      if (!selectedProgram) {
        return;
      }

      const [curriculum] = await getCurriculaByProgram(selectedProgram);

      if (!curriculum) {
        setCompletedCompetencies(null);
        setSelectedCurriculum(null);
        setGearTypes([]);
        return;
      }

      setSelectedCurriculum(curriculum);
      const gearTypes = await getGearTypesByCurriculum(curriculum.id);
      setGearTypes(gearTypes);
    }

    void fetchCurricula();
  }, [selectedProgram]);

  useEffect(() => {
    async function fetchCompletedCompetencies() {
      if (!selectedPerson || !selectedCurriculum || !selectedGearType) {
        return;
      }

      const completedCompetencies = await getCompletedCompetencies(
        selectedPerson.id,
        selectedCurriculum.id,
        selectedGearType,
      );

      setCompletedCompetencies(completedCompetencies ?? []);
    }

    void fetchCompletedCompetencies();
  }, [selectedPerson, selectedCurriculum, selectedGearType]);

  return (
    <>
      <Button
        color="branding-orange"
        type="button"
        onClick={() => setIsOpen(true)}
        className={"whitespace-nowrap"}
      >
        <PlusIcon />
        Diploma toevoegen
      </Button>
      <Dialog open={isOpen} onClose={setIsOpen} size="2xl">
        <DialogTitle>Diploma toevoegen</DialogTitle>
        <DialogDescription>
          Vul de gegevens in om een diploma toe te voegen.
        </DialogDescription>
        <form action={formAction}>
          <DialogBody>
            <Fieldset>
              <FieldGroup>
                <Field className="max-w-md">
                  <Label>Cursist</Label>
                  <Headless.Combobox
                    name="person"
                    onClose={() => setPersonQuery("")}
                    virtual={{ options: filteredPersons }}
                    multiple={false}
                    value={selectedPerson}
                    onChange={(value) => setSelectedPerson(value)}
                  >
                    <div
                      className={clsx([
                        // Basic layout
                        "group mt-3 relative block w-full",

                        // Background color + shadow applied to inset pseudo element, so shadow blends with border in light mode
                        "before:absolute before:inset-px before:rounded-[calc(theme(borderRadius.lg)-1px)] before:bg-white before:shadow",

                        // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
                        "dark:before:hidden",

                        // Hide default focus styles
                        "focus:outline-none",

                        // Focus ring
                        "after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-inset after:ring-transparent sm:after:data-[focus]:ring-2 sm:after:data-[focus]:ring-blue-500",

                        // Disabled state
                        "data-[disabled]:opacity-50 before:data-[disabled]:bg-zinc-950/5 before:data-[disabled]:shadow-none",
                      ])}
                    >
                      <Headless.ComboboxInput
                        autoFocus={true}
                        data-slot="control"
                        displayValue={(
                          person: (typeof persons)[number] | undefined,
                        ) => {
                          if (!person) return "";

                          const fullName = [
                            person.firstName,
                            person.lastNamePrefix,
                            person.lastName,
                          ]
                            .filter(Boolean)
                            .join(" ");

                          return fullName;
                        }}
                        onChange={(e) => setPersonQuery(e.target.value)}
                        data-invalid={!!state?.errors.personId}
                        className={clsx([
                          // Basic layout
                          "relative block w-full appearance-none rounded-lg py-[calc(theme(spacing[2.5])-1px)] sm:py-[calc(theme(spacing[1.5])-1px)]",

                          // Set minimum height for when no value is selected
                          "min-h-11 sm:min-h-9",

                          // Horizontal padding
                          "pl-[calc(theme(spacing[3.5])-1px)] pr-[calc(theme(spacing.7)-1px)] sm:pl-[calc(theme(spacing.3)-1px)]",

                          // Typography
                          "text-left text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white forced-colors:text-[CanvasText]",

                          // Border
                          "border border-zinc-950/10 group-data-[active]:border-zinc-950/20 group-data-[hover]:border-zinc-950/20 dark:border-white/10 dark:group-data-[active]:border-white/20 dark:group-data-[hover]:border-white/20",

                          // Background color
                          "bg-transparent dark:bg-white/5",

                          // Invalid state
                          "group-data-[invalid]:border-red-500 group-data-[invalid]:group-data-[hover]:border-red-500 group-data-[invalid]:dark:border-red-600 group-data-[invalid]:data-[hover]:dark:border-red-600",

                          // Disabled state
                          "group-data-[disabled]:border-zinc-950/20 group-data-[disabled]:opacity-100 group-data-[disabled]:dark:border-white/15 group-data-[disabled]:dark:bg-white/[2.5%] dark:data-[hover]:group-data-[disabled]:border-white/15",
                        ])}
                      />
                      <Headless.ComboboxButton
                        className={
                          "absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none"
                        }
                      >
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <svg
                            className="size-5 stroke-zinc-500 group-data-[disabled]:stroke-zinc-600 sm:size-4 dark:stroke-zinc-400 forced-colors:stroke-[CanvasText]"
                            viewBox="0 0 16 16"
                            aria-hidden="true"
                            fill="none"
                          >
                            <path
                              d="M5.75 10.75L8 13L10.25 10.75"
                              strokeWidth={1.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M10.25 5.25L8 3L5.75 5.25"
                              strokeWidth={1.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </Headless.ComboboxButton>

                      <Headless.ComboboxOptions
                        as="div"
                        anchor={{
                          to: "bottom start",
                          gap: "var(--anchor-gap)",
                          offset: "var(--anchor-offset)",
                          padding: "var(--anchor-padding)",
                        }}
                        className={clsx(
                          // Anchor positioning
                          "[--anchor-offset:-1.625rem] [--anchor-padding:theme(spacing.4)] sm:[--anchor-offset:-1.375rem]",

                          // Base styles
                          "isolate w-max min-w-[calc(var(--button-width)+var(--input-width)+1.75rem)] empty:invisible select-none scroll-py-1 rounded-xl p-1",

                          // Invisible border that is only visible in `forced-colors` mode for accessibility purposes
                          "outline outline-1 outline-transparent focus:outline-none",

                          // Handle scrolling when menu won't fit in viewport
                          "overflow-y-scroll overscroll-contain",

                          // Popover background
                          "bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75",

                          // Shadows
                          "shadow-lg ring-1 ring-zinc-950/10 dark:ring-inset dark:ring-white/10",
                        )}
                      >
                        {({
                          option: person,
                        }: {
                          option: (typeof filteredPersons)[number];
                        }) => {
                          const fullName = [
                            person.firstName,
                            person.lastNamePrefix,
                            person.lastName,
                          ]
                            .filter(Boolean)
                            .join(" ");
                          return (
                            <ComboboxOption
                              key={person.id}
                              value={person}
                              className="inset-x-0"
                            >
                              <ComboboxLabel>
                                <div className="flex">
                                  <span className={clsx("truncate")}>
                                    {fullName}
                                  </span>
                                  <span
                                    className={clsx(
                                      "ml-2 truncate text-gray-500 group-data-[active]/option:text-white",
                                    )}
                                  >
                                    {person.dateOfBirth
                                      ? dayjs(person.dateOfBirth).format(
                                          "DD-MM-YYYY",
                                        )
                                      : null}
                                  </span>
                                </div>
                              </ComboboxLabel>
                            </ComboboxOption>
                          );
                        }}
                      </Headless.ComboboxOptions>
                    </div>
                  </Headless.Combobox>
                </Field>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4">
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
                        setSelectedGearType(null);
                        setGearTypes([]);
                        setSelectedCurriculum(null);
                        setCompletedCompetencies(null);
                      }}
                      invalid={!!state?.errors.curriculumId}
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
                      disabled={!selectedProgram}
                      value={selectedGearType}
                      onChange={(value) => setSelectedGearType(value)}
                      invalid={!!state?.errors.gearTypeId}
                    >
                      {gearTypes.map((gearType) => (
                        <ListboxOption key={gearType.id} value={gearType.id}>
                          <ListboxLabel>{gearType.title}</ListboxLabel>
                        </ListboxOption>
                      ))}
                    </Listbox>
                  </Field>
                </div>

                <Fieldset>
                  <Legend>Modules</Legend>
                  {selectedCurriculum && completedCompetencies !== null ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 mt-2 gap-x-4">
                      <CheckboxGroup>
                        <Legend>Kernmodules</Legend>
                        {selectedCurriculum.modules
                          .sort((a, b) => a.weight - b.weight)
                          .filter((module) => module.isRequired)
                          .map((module) => (
                            <CheckboxField
                              key={module.id}
                              disabled={module.competencies.every((c) =>
                                completedCompetencies?.includes(c.id),
                              )}
                            >
                              <Checkbox
                                name="competencies[]"
                                value={module.competencies
                                  .map((c) => c.id)
                                  .join(",")}
                                defaultChecked={true}
                              />
                              <Label>{module.title}</Label>
                            </CheckboxField>
                          ))}
                      </CheckboxGroup>
                      <CheckboxGroup>
                        <Legend>Keuzemodules</Legend>
                        {selectedCurriculum.modules
                          .sort((a, b) => a.weight - b.weight)
                          .filter((module) => !module.isRequired)
                          .map((module) => (
                            <CheckboxField key={module.id}>
                              <Checkbox
                                name="competencies[]"
                                value={module.competencies
                                  .map((c) => c.id)
                                  .join(",")}
                                defaultChecked={false}
                              />
                              <Label>{module.title}</Label>
                            </CheckboxField>
                          ))}
                      </CheckboxGroup>
                    </div>
                  ) : (
                    <Text>Selecteer eerst een programma...</Text>
                  )}
                </Fieldset>
              </FieldGroup>
            </Fieldset>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={() => setIsOpen(false)}>
              Sluiten
            </Button>
            <SubmitButton />
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Opslaan
    </Button>
  );
}
