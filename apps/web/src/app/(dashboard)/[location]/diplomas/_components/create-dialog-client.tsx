"use client";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
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

export default function CreateDialogClient({
  locationId,
  persons,
  programs,
}: {
  locationId: string;
  persons: Awaited<ReturnType<typeof listPersonsForLocation>>;
  programs: Awaited<ReturnType<typeof listPrograms>>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const [state, formAction] = useFormState(createCertificate, {
    message: "",
    errors: {},
  });

  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedGearType, setSelectedGearType] = useState<string | null>(null);
  const [selectedCurricula, setSelectedCurricula] = useState<
    Awaited<ReturnType<typeof listCurriculaByProgram>>[number] | null
  >(null);

  const [programQuery, setProgramQuery] = useState("");
  const [personQuery, setPersonQuery] = useState("");

  const [gearTypes, setGearTypes] = useState<
    Awaited<ReturnType<typeof listGearTypesByCurriculum>>
  >([]);

  useEffect(() => {
    if (selectedProgram) {
      getCurriculaByProgram(selectedProgram)
        .then((curricula) => {
          if (curricula.length !== 1 || !curricula[0]) return [];

          setSelectedCurricula(curricula[0]);
          return getGearTypesByCurriculum(curricula[0].id);
        })
        .then((gearTypes) => {
          setGearTypes(gearTypes);
        })
        .catch(() => {
          setSelectedCurricula(null);
          setGearTypes([]);
        });
    }
  }, [selectedProgram]);

  return (
    <>
      <Button
        color="branding-dark"
        type="button"
        onClick={() => setIsOpen(true)}
        className={"whitespace-nowrap"}
      >
        Diploma toevoegen
      </Button>
      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>Diploma toevoegen</DialogTitle>
        <DialogDescription>
          Vul de gegevens in om een diploma toe te voegen.
        </DialogDescription>
        <form action={formAction}>
          <DialogBody>
            <Fieldset>
              <FieldGroup>
                <Field>
                  <Label>Programma</Label>
                  {/* TODO: this combobox is temporary used should be from catalyst */}
                  <Combobox
                    name="program"
                    setQuery={setProgramQuery}
                    displayValue={(value: string) =>
                      programs.find((program) => program.id === value)?.title ??
                      ""
                    }
                    onChange={(value) => {
                      setSelectedProgram(value);
                      setSelectedGearType(null);
                      setGearTypes([]);
                      setSelectedCurricula(null);
                    }}
                    invalid={!!state.errors.curriculumId}
                  >
                    {programs
                      .filter(
                        (x) =>
                          programQuery.length < 1 ||
                          x.title
                            ?.toLowerCase()
                            .includes(programQuery.toLowerCase()),
                      )
                      .map((program) => (
                        <ComboboxOption key={program.id} value={program.id}>
                          <ComboboxLabel>{program.title}</ComboboxLabel>
                        </ComboboxOption>
                      ))}
                  </Combobox>
                </Field>
                <Field>
                  <Label>Gear Type</Label>
                  <Listbox
                    name="gearTypeId"
                    value={selectedGearType}
                    onChange={(value) => setSelectedGearType(value)}
                    invalid={!!state.errors.gearTypeId}
                  >
                    {gearTypes.map((gearType) => (
                      <ListboxOption key={gearType.id} value={gearType.id}>
                        <ListboxLabel>{gearType.title}</ListboxLabel>
                      </ListboxOption>
                    ))}
                  </Listbox>
                </Field>
                <Field>
                  <Label>Student</Label>
                  <Combobox
                    name="personId"
                    setQuery={setPersonQuery}
                    displayValue={(value: string) => {
                      const person = persons.find(
                        (person) => person.id === value,
                      );
                      if (!person) return "";
                      return [
                        person.firstName,
                        person.lastNamePrefix,
                        person.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ");
                    }}
                    invalid={!!state.errors.personId}
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
                      .map((person) => (
                        <ComboboxOption key={person.id} value={person.id}>
                          <ComboboxLabel>
                            {[
                              person.firstName,
                              person.lastNamePrefix,
                              person.lastName,
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          </ComboboxLabel>
                        </ComboboxOption>
                      ))}
                  </Combobox>
                </Field>
                <Fieldset>
                  <CheckboxGroup>
                    <Legend>Modules</Legend>
                    {selectedCurricula ? (
                      selectedCurricula.modules
                        .sort((a, b) => a.weight - b.weight)
                        .map((module) => (
                          <CheckboxField>
                            <Checkbox
                              name="competencies[]"
                              value={module.id}
                              defaultChecked={module.isRequired}
                              disabled={module.isRequired}
                            />
                            <Label>{module.title}</Label>
                          </CheckboxField>
                        ))
                    ) : (
                      <span>Geen modules gevonden</span>
                    )}
                  </CheckboxGroup>
                </Fieldset>
              </FieldGroup>
              <input type="hidden" name="locationId" value={locationId} />
              <input
                type="hidden"
                name="curriculumId"
                value={selectedCurricula?.id}
              />
            </Fieldset>
          </DialogBody>
          <DialogActions>
            {state.message === "Success" ? (
              <Button
                color="branding-dark"
                onClick={() => {
                  setSelectedProgram(null);
                  setSelectedGearType(null);
                  setSelectedCurricula(null);
                  setIsOpen(false);
                }}
              >
                Sluiten
              </Button>
            ) : (
              <>
                <Button
                  plain
                  onClick={() => {
                    setSelectedProgram(null);
                    setSelectedGearType(null);
                    setSelectedCurricula(null);
                    setIsOpen(false);
                  }}
                >
                  Sluiten
                </Button>
                <SubmitButton />
              </>
            )}
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
