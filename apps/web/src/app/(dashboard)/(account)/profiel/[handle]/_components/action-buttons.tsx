"use client";

import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";

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
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import {
  Field,
  FieldGroup,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { updatePerson } from "../_actions/person";

export function EditDetails({
  person,
  countries,
}: {
  person: {
    id: string;
    firstName: string;
    lastNamePrefix: string | null;
    lastName: string | null;
    dateOfBirth: string | null;
    birthCity: string | null;
    birthCountry: {
      name: string;
      code: string;
    } | null;
  };
  countries: { code: string; name: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await updatePerson(
      { personId: person.id },
      prevState,
      formData,
    );

    if (result.message === "Success") {
      setIsOpen(false);
      toast.success("Gegevens bijgewerkt.");
    }

    return result;
  };

  const [state, action] = useFormState(submit, undefined);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(
    person.birthCountry?.code ?? null,
  );

  const [countryQuery, setCountryQuery] = useState("");

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
      <Dropdown>
        <DropdownButton plain className="-my-1.5">
          <EllipsisHorizontalIcon />
        </DropdownButton>
        <DropdownMenu anchor="bottom end">
          <DropdownItem onClick={() => setIsOpen(true)}>
            Wijzig gegevens
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>Personalia wijzigen</DialogTitle>
        <form action={action}>
          <DialogBody>
            <Fieldset>
              <FieldGroup>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-4">
                  <Field>
                    <Label>Voornaam</Label>
                    <Input
                      name="firstName"
                      invalid={!!state?.errors.firstName}
                      defaultValue={person.firstName}
                      required
                      minLength={1}
                    />
                  </Field>
                  <Field>
                    <Label>Tussenvoegsel</Label>
                    <Input
                      name="lastNamePrefix"
                      invalid={!!state?.errors.lastNamePrefix}
                      defaultValue={person.lastNamePrefix ?? undefined}
                    />
                  </Field>
                  <Field>
                    <Label>Achternaam</Label>
                    <Input
                      name="lastName"
                      invalid={!!state?.errors.lastName}
                      defaultValue={person.lastName ?? undefined}
                      required
                      minLength={1}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-5 sm:gap-4">
                  <Field className="sm:col-span-3">
                    <Label>Geboortedatum</Label>
                    <Input
                      name="dateOfBirth"
                      type="date"
                      invalid={!!state?.errors.dateOfBirth}
                      defaultValue={person.dateOfBirth ?? undefined}
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
                      defaultValue={person.birthCity ?? undefined}
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
      Opslaan
    </Button>
  );
}
