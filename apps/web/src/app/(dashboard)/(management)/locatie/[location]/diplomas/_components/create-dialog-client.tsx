"use client";
import { PlusIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { issueCertificateAction } from "~/app/_actions/certificate/issue-certificate-action";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
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
  Description,
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
import dayjs from "~/lib/dayjs";
import type {
  listCurriculaByProgram,
  listGearTypesByCurriculumForLocation,
  listProgramsForLocation,
} from "~/lib/nwd";
import {
  getCurriculaByProgram,
  getExistingStudentCurriculumProgress,
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
      onError: ({ error }) => {
        toast.error(error.serverError ?? DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  const { getInputValue } = useFormInput(input);

  const [selectedProgram, setSelectedProgram] = useState<
    NonNullable<typeof programs>[number] | null
  >(
    programs?.find((program) => program.id === getInputValue("program")?.id) ??
      null,
  );
  const [selectedGearType, setSelectedGearType] = useState<string | null>(
    getInputValue("gearType")?.id ?? null,
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

  const [selectedPerson, setSelectedPerson] = useState<
    NonNullable<typeof searchedStudents>["items"][number] | null
  >(null);

  const [gearTypes, setGearTypes] = useState<
    Awaited<ReturnType<typeof listGearTypesByCurriculumForLocation>>
  >([]);

  const [completedCompetencyIds, setCompletedCompetencyIds] = useState<
    string[]
  >([]);
  const [isProgressLoading, setIsProgressLoading] = useState(false);

  // @TODO why are we using an effect for this?
  useEffect(() => {
    async function fetchCurricula() {
      if (!selectedProgram) {
        return;
      }

      const [curriculum] = await getCurriculaByProgram(selectedProgram.id);

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

  // Fetch the cursist's already-proven competencies for the selected
  // programma + vaartuig so the dialog can render proven modules as
  // "Al behaald" and let the server issue a partial diploma over the delta.
  useEffect(() => {
    const personId = selectedPerson?.id;
    const curriculumId = selectedCurriculum?.id;
    const gearTypeId = selectedGearType;

    if (!personId || !curriculumId || !gearTypeId) {
      setCompletedCompetencyIds([]);
      setIsProgressLoading(false);
      return;
    }

    let cancelled = false;
    setIsProgressLoading(true);

    getExistingStudentCurriculumProgress(
      locationId,
      personId,
      curriculumId,
      gearTypeId,
    )
      .then((progress) => {
        if (cancelled) return;
        setCompletedCompetencyIds(progress?.completedCompetencyIds ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setCompletedCompetencyIds([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsProgressLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    locationId,
    selectedPerson?.id,
    selectedCurriculum?.id,
    selectedGearType,
  ]);

  if (!searchedStudents)
    throw new Error("Person list data must be available through fallback");

  const provenSet = new Set(completedCompetencyIds);

  const allModulesFullyProven =
    !!selectedCurriculum &&
    selectedCurriculum.modules.length > 0 &&
    selectedCurriculum.modules.every((module) => {
      const competencyIds = module.competencies.map((c) => c.id);
      return (
        competencyIds.length > 0 &&
        competencyIds.every((id) => provenSet.has(id))
      );
    });

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
                      onChange={setSelectedPerson}
                      displayValue={(person) => {
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
                      setQuery={setPersonQuery}
                      filter={() => true}
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
                          (program) =>
                            program.id === getInputValue("program")?.id,
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
                  <Field>
                    <Label>Vaartuig</Label>
                    <Listbox
                      name="gearType[id]"
                      disabled={!selectedProgram}
                      value={selectedGearType ?? getInputValue("gearType")?.id}
                      defaultValue={getInputValue("gearType")?.id}
                      onChange={setSelectedGearType}
                      invalid={!!result.validationErrors?.gearType}
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
                        name="curriculum[id]"
                        value={
                          selectedCurriculum.id ??
                          getInputValue("curriculum")?.id ??
                          ""
                        }
                      />
                      <CheckboxGroup>
                        <Legend>Kernmodules</Legend>
                        {selectedCurriculum.modules
                          .sort((a, b) => a.weight - b.weight)
                          .filter((module) => module.isRequired)
                          .map((module) => (
                            <ModuleCheckboxField
                              key={module.id}
                              module={module}
                              provenSet={provenSet}
                              defaultCheckedWhenOpen={true}
                            />
                          ))}
                      </CheckboxGroup>
                      <CheckboxGroup>
                        <Legend>Keuzemodules</Legend>
                        {selectedCurriculum.modules
                          .sort((a, b) => a.weight - b.weight)
                          .filter((module) => !module.isRequired)
                          .map((module) => (
                            <ModuleCheckboxField
                              key={module.id}
                              module={module}
                              provenSet={provenSet}
                              defaultCheckedWhenOpen={false}
                            />
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
            {allModulesFullyProven ? (
              <Text className="mr-auto text-left">
                Deze cursist heeft dit diploma al volledig behaald.
              </Text>
            ) : null}
            <Button plain onClick={closeDialog}>
              Sluiten
            </Button>
            <SubmitButton
              disabled={isProgressLoading || allModulesFullyProven}
            />
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

function ModuleCheckboxField({
  module,
  provenSet,
  defaultCheckedWhenOpen,
}: {
  module: Awaited<
    ReturnType<typeof listCurriculaByProgram>
  >[number]["modules"][number];
  provenSet: Set<string>;
  defaultCheckedWhenOpen: boolean;
}) {
  const competencyIds = module.competencies.map((c) => c.id);
  const provenCount = competencyIds.filter((id) => provenSet.has(id)).length;
  const isFullyProven =
    competencyIds.length > 0 && provenCount === competencyIds.length;
  const isPartiallyProven =
    provenCount > 0 && provenCount < competencyIds.length;

  return (
    // The proven-state key remounts the uncontrolled checkbox when the
    // async progress fetch flips its defaultChecked/disabled state.
    <CheckboxField key={`${module.id}-${isFullyProven ? "proven" : "open"}`}>
      <Checkbox
        name="competencies"
        value={competencyIds.join(",")}
        defaultChecked={isFullyProven || defaultCheckedWhenOpen}
        disabled={isFullyProven}
      />
      <Label>{module.title}</Label>
      {isFullyProven ? (
        <Description>Al behaald</Description>
      ) : isPartiallyProven ? (
        <Description>
          {provenCount} van {competencyIds.length} competenties al behaald
        </Description>
      ) : null}
    </CheckboxField>
  );
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending || disabled} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Opslaan
    </Button>
  );
}
