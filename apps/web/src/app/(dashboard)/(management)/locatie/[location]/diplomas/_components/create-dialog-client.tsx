"use client";
import { PlusIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
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
import { usePersonsForLocation } from "~/app/(dashboard)/_hooks/swr/use-persons-for-location";
import { issueCertificateAction } from "~/app/_actions/certificate/issue-certificate-action";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
import dayjs from "~/lib/dayjs";
import type {
  listCurriculaByProgram,
  listGearTypesByCurriculumForLocation,
  listProgramsForLocation,
} from "~/lib/nwd";
import {
  getCurriculaByProgram,
  getGearTypesByCurriculumForLocation,
} from "../_actions/fetch";

interface Props {
  locationId: string;
  programs: Awaited<ReturnType<typeof listProgramsForLocation>>;
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
  programs,
  isOpen,
  setIsOpen,
}: Props & { isOpen: boolean; setIsOpen: (value: boolean) => void }) {
  const closeDialog = () => {
    setIsOpen(false);
    reset();
  };

  const { execute, result, input, reset } = useAction(
    issueCertificateAction.bind(null, locationId),
    {
      onSuccess: () => {
        toast.success("Diploma toegevoegd");
        closeDialog();
      },
      onError: () => {
        toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  const { getInputValue } = useFormInput(input);

  const [selectedProgram, setSelectedProgram] = useState<string | null>(
    programs?.find((program) => program.id === getInputValue("curriculumId"))
      ?.id ?? null,
  );
  const [selectedGearType, setSelectedGearType] = useState<string | null>(
    getInputValue("gearTypeId") ?? null,
  );
  const [selectedCurriculum, setSelectedCurriculum] = useState<
    Awaited<ReturnType<typeof listCurriculaByProgram>>[number] | null
  >(null);

  const [personQuery, setPersonQuery] = useState("");

  const { data: searchedStudents, isLoading: isPersonsLoading } =
    usePersonsForLocation(locationId, {
      filter: {
        query: personQuery,
        actorType: "student",
      },
    });

  const [gearTypes, setGearTypes] = useState<
    Awaited<ReturnType<typeof listGearTypesByCurriculumForLocation>>
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
      const gearTypes = await getGearTypesByCurriculumForLocation(
        locationId,
        curriculum.id,
      );
      setGearTypes(gearTypes);
    }

    void fetchCurricula();
  }, [selectedProgram, locationId]);

  return (
    <>
      <Button
        color="branding-orange"
        type="button"
        onClick={() => setIsOpen(true)}
        className="whitespace-nowrap"
      >
        <PlusIcon />
        Diploma toevoegen
      </Button>
      <Dialog open={isOpen} onClose={closeDialog} size="2xl">
        <DialogTitle>Diploma toevoegen</DialogTitle>
        <DialogDescription>
          Vul de gegevens in om een diploma toe te voegen.
        </DialogDescription>
        <form action={execute}>
          <DialogBody>
            <Fieldset>
              <FieldGroup>
                <Field className="max-w-md">
                  <Label>Cursist</Label>
                  <div className="relative w-full">
                    <Combobox
                      name="person"
                      options={searchedStudents.items}
                      autoFocus={true}
                      displayValue={(person) => {
                        const fullName = [
                          person.firstName,
                          person.lastNamePrefix,
                          person.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return fullName;
                      }}
                      setQuery={setPersonQuery}
                      filter={null}
                    >
                      {(person) => (
                        <ComboboxOption
                          key={person.id}
                          value={person}
                          className="inset-x-0"
                        >
                          <ComboboxLabel>
                            <div className="flex">
                              <span className={clsx("truncate")}>
                                {[
                                  person.firstName,
                                  person.lastNamePrefix,
                                  person.lastName,
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                              </span>
                              <span
                                className={clsx(
                                  "ml-2 text-slate-500 group-data-active/option:text-white truncate",
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
                      )}
                    </Combobox>
                    {isPersonsLoading && (
                      <div className="right-8 absolute inset-y-0 flex items-center">
                        <Spinner />
                      </div>
                    )}
                  </div>
                </Field>

                <div className="gap-4 grid grid-cols-1 lg:grid-cols-2">
                  <Field>
                    <Label>Programma</Label>
                    <Combobox
                      name="program"
                      options={programs.map((program) => program.id)}
                      displayValue={(programId) => {
                        const program = ensuredFind(
                          programs,
                          (program) => program.id === programId,
                        );

                        return (
                          program.title ??
                          `${program.course.title} ${program.degree.title}`
                        );
                      }}
                      onChange={setSelectedProgram}
                      value={selectedProgram}
                      defaultValue={
                        programs?.find(
                          (program) =>
                            program.id === getInputValue("curriculumId"),
                        )?.id ?? null
                      }
                      invalid={!!result?.validationErrors?.curriculumId}
                    >
                      {(programId) => {
                        const program = ensuredFind(
                          programs,
                          (program) => program.id === programId,
                        );

                        return (
                          <ComboboxOption key={programId} value={programId}>
                            <ComboboxLabel>
                              {program.title ??
                                `${program.course.title} ${program.degree.title}`}
                            </ComboboxLabel>
                          </ComboboxOption>
                        );
                      }}
                    </Combobox>
                  </Field>
                  <Field>
                    <Label>Vaartuig</Label>
                    <Listbox
                      name="gearTypeId"
                      disabled={!selectedProgram}
                      value={selectedGearType ?? getInputValue("gearTypeId")}
                      defaultValue={getInputValue("gearTypeId")}
                      onChange={setSelectedGearType}
                      invalid={!!result.validationErrors?.gearTypeId}
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
                    <div className="gap-4 grid grid-cols-1 lg:grid-cols-2 mt-2">
                      <input
                        type="hidden"
                        name="curriculumId"
                        value={
                          selectedCurriculum.id ?? getInputValue("curriculumId")
                        }
                      />
                      <CheckboxGroup>
                        <Legend>Kernmodules</Legend>
                        {selectedCurriculum.modules
                          .sort((a, b) => a.weight - b.weight)
                          .filter((module) => module.isRequired)
                          .map((module) => (
                            <CheckboxField key={module.id}>
                              <Checkbox
                                name="competencies"
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
                                name="competencies"
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
            <Button plain onClick={closeDialog}>
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
