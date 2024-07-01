"use client";
import { PlusIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import dayjs from "dayjs";
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
import type {
  listCurriculaByProgram,
  listGearTypesByCurriculum,
  listPersonsForLocation,
  listPrograms,
} from "~/lib/nwd";
import { createCertificate } from "../_actions/create";
import {
  getCurriculaByProgram,
  getGearTypesByCurriculum,
} from "../_actions/fetch";

interface Props {
  locationId: string;
  persons: Awaited<ReturnType<typeof listPersonsForLocation>>;
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

    return result;
  };

  const [state, formAction] = useActionState(submit, undefined);

  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedGearType, setSelectedGearType] = useState<string | null>(null);
  const [selectedCurriculum, setSelectedCurriculum] = useState<
    Awaited<ReturnType<typeof listCurriculaByProgram>>[number] | null
  >(null);

  const [programQuery, setProgramQuery] = useState("");
  const [personQuery, setPersonQuery] = useState("");

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
                  <Combobox
                    name="personId"
                    setQuery={setPersonQuery}
                    displayValue={(value: string) => {
                      const person = persons.find(
                        (person) => person.id === value,
                      );

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
                    invalid={!!state?.errors.personId}
                  >
                    {persons
                      .filter(
                        (x) =>
                          personQuery.length < 1 ||
                          [x.firstName, x.lastNamePrefix, x.lastName]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase()
                            .includes(personQuery.toLowerCase()),
                      )
                      .map((person) => {
                        const fullName = [
                          person.firstName,
                          person.lastNamePrefix,
                          person.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <ComboboxOption key={person.id} value={person.id}>
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
                                  {dayjs(person.dateOfBirth).format(
                                    "DD-MM-YYYY",
                                  )}
                                </span>
                              </div>
                            </ComboboxLabel>
                          </ComboboxOption>
                        );
                      })}
                  </Combobox>
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
                    <Label>Materiaal</Label>
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
                  {selectedCurriculum ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 mt-2 gap-x-4">
                      <CheckboxGroup>
                        <Legend>Kernmodules</Legend>
                        {selectedCurriculum.modules
                          .sort((a, b) => a.weight - b.weight)
                          .filter((module) => module.isRequired)
                          .map((module) => (
                            <CheckboxField key={module.id}>
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
                        <Legend>Specialisatiemodules</Legend>
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
      Opslaan
    </Button>
  );
}
