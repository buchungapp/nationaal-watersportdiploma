"use client";

import { clsx } from "clsx";
import dayjs from "dayjs";
import { useRef, useState } from "react";
import { useFormState as useActionState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "~/app/(dashboard)/_components/button";
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
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  Field,
  FieldGroup,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Input } from "~/app/(dashboard)/_components/input";
import { createPerson } from "../_actions/create";
import {
  addStudentToCohortByPersonId,
  listCountries,
  listPersonsForLocationByRole,
} from "../_actions/nwd";

interface Props {
  locationId: string;
  cohortId: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export default function Wrapper(props: Props) {
  const forceRerenderId = useRef(0);

  return (
    <CreateDialog
      key={String(forceRerenderId.current)}
      {...props}
      isOpen={props.isOpen}
      setIsOpen={(next) => {
        props.setIsOpen(next);
        forceRerenderId.current += 1;
      }}
    />
  );
}

function CreateDialog({ locationId, cohortId, isOpen, setIsOpen }: Props) {
  const submit = async (
    prevState: unknown,
    formData: FormData,
  ): Promise<{
    message: string;
    errors: Record<string, string>;
  }> => {
    let existingPersonId = formData.get("personId") as string | null;

    if (!existingPersonId) {
      const result = await createPerson(locationId, prevState, formData);

      if (result.message !== "Success") {
        toast.error("Er is iets misgegaan.");
        return result;
      }

      existingPersonId = result.data!.id;
    }

    await addStudentToCohortByPersonId({
      cohortId,
      locationId,
      personId: existingPersonId,
    }).catch(() => {
      toast.error("Er is iets misgegaan.");
      return { message: "Error", errors: {} };
    });

    setIsOpen(false);
    toast.success("Cursist is toegevoegd.");

    return { message: "Success", errors: {} };
  };

  const [state, formAction] = useActionState(submit, undefined);
  const [selectedCountry, setSelectedCountry] = useState<string | null>("nl");
  const [selectedPersonId, setSelectedPerson] = useState<string | null>(null);

  const [personQuery, setPersonQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");

  const { data: countries } = useSWR("countries", listCountries);
  const { data: allStudents } = useSWR(`allStudents-${locationId}`, async () =>
    listPersonsForLocationByRole(locationId, "student"),
  );

  if (!countries || !allStudents)
    throw new Error("Data must be available through fallback");

  const selectedPerson = allStudents.find(
    (person) => person.id === selectedPersonId,
  );

  if (!!selectedPersonId && !selectedPerson) {
    throw new Error("Person not found");
  }

  const filteredCountries =
    countryQuery === ""
      ? countries
      : countries.filter((country) => {
          return country.name
            .toLowerCase()
            .includes(countryQuery.toLowerCase());
        });

  return (
    <>
      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>Cursist toevoegen</DialogTitle>

        <form action={formAction}>
          <Field className="max-w-md">
            <Label>Vind een bestaande</Label>
            <Combobox
              name="personId"
              setQuery={setPersonQuery}
              value={selectedPersonId}
              onChange={setSelectedPerson}
              displayValue={(value: string) => {
                const person = allStudents.find(
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
              invalid={!!state?.errors?.personId}
            >
              {allStudents
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
                          <span className={clsx("truncate")}>{fullName}</span>
                          <span
                            className={clsx(
                              "ml-2 truncate text-gray-500 group-data-[active]/option:text-white",
                            )}
                          >
                            {dayjs(person.dateOfBirth).format("DD-MM-YYYY")}
                          </span>
                        </div>
                      </ComboboxLabel>
                    </ComboboxOption>
                  );
                })}
            </Combobox>
          </Field>

          <Divider className="my-6" />
          <Subheading>Maak een nieuwe</Subheading>

          <DialogBody>
            <Fieldset disabled={!!selectedPerson}>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-4">
                  <Field>
                    <Label>Voornaam</Label>
                    <Input
                      name="firstName"
                      invalid={!!state?.errors.firstName}
                      required
                      minLength={1}
                    />
                  </Field>
                  <Field>
                    <Label>Tussenvoegsel</Label>
                    <Input
                      name="lastNamePrefix"
                      invalid={!!state?.errors.lastNamePrefix}
                    />
                  </Field>
                  <Field>
                    <Label>Achternaam</Label>
                    <Input
                      name="lastName"
                      invalid={!!state?.errors.lastName}
                      required
                      minLength={1}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-5 sm:gap-4">
                  <Field className="sm:col-span-3">
                    <Label>E-mail</Label>
                    <Input
                      name="email"
                      type="email"
                      invalid={!!state?.errors.email}
                      required
                    />
                  </Field>
                  <Field className="sm:col-span-2">
                    <Label>Geboortedatum</Label>
                    <Input
                      name="dateOfBirth"
                      type="date"
                      invalid={!!state?.errors.dateOfBirth}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
                  <Field>
                    <Label>Geboorteplaats</Label>
                    <Input
                      name="birthCity"
                      invalid={!!state?.errors.birthCity}
                    />
                  </Field>
                  <Field>
                    <Label>Geboorteland</Label>
                    <Combobox
                      name="birthCountry"
                      invalid={!!state?.errors.birthCountry}
                      value={selectedCountry}
                      setQuery={setCountryQuery}
                      onChange={(value) => setSelectedCountry(value)}
                      displayValue={(value: string | null) => {
                        if (!value) return "";
                        const country = countries.find(
                          (country) => country.code === value,
                        );
                        return country?.name ?? "";
                      }}
                      defaultValue="nl"
                    >
                      {filteredCountries.map((country) => (
                        <ComboboxOption key={country.code} value={country.code}>
                          <ComboboxLabel>{country.name}</ComboboxLabel>
                        </ComboboxOption>
                      ))}
                    </Combobox>
                  </Field>
                </div>
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
      Toevoegen
    </Button>
  );
}
