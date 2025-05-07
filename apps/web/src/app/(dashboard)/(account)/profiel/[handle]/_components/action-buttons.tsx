"use client";

import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { useAction } from "next-safe-action/hooks";
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
  DropdownLabel,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import {
  Field,
  FieldGroup,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updatePersonDetailsAction } from "~/app/_actions/person/update-person-details-action";
import Spinner from "~/app/_components/spinner";

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

  const { execute, result, input, reset } = useAction(
    updatePersonDetailsAction.bind(null, person.id, undefined),
    {
      onSuccess: () => {
        closeDialog();
        toast.success("Gegevens bijgewerkt.");
      },
    },
  );

  const closeDialog = () => {
    setIsOpen(false);
    reset();
  };

  const { getInputValue } = useFormInput(input, {
    ...person,
    birthCountry: person.birthCountry?.code ?? null,
  });

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
        <DropdownButton outline className="-my-1.5">
          <EllipsisHorizontalIcon />
        </DropdownButton>
        <DropdownMenu anchor="bottom end">
          <DropdownItem onClick={() => setIsOpen(true)}>
            <DropdownLabel> Wijzig gegevens</DropdownLabel>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <Dialog open={isOpen} onClose={closeDialog}>
        <DialogTitle>Personalia wijzigen</DialogTitle>
        <form action={execute}>
          <DialogBody>
            <Fieldset>
              <FieldGroup>
                <div className="gap-8 sm:gap-4 grid grid-cols-1 sm:grid-cols-3">
                  <Field>
                    <Label>Voornaam</Label>
                    <Input
                      name="firstName"
                      invalid={!!result?.validationErrors?.firstName}
                      defaultValue={getInputValue("firstName")}
                      required
                      minLength={1}
                    />
                  </Field>
                  <Field>
                    <Label>Tussenvoegsel</Label>
                    <Input
                      name="lastNamePrefix"
                      invalid={!!result?.validationErrors?.lastNamePrefix}
                      defaultValue={getInputValue("lastNamePrefix")}
                    />
                  </Field>
                  <Field>
                    <Label>Achternaam</Label>
                    <Input
                      name="lastName"
                      invalid={!!result?.validationErrors?.lastName}
                      defaultValue={getInputValue("lastName")}
                      required
                      minLength={1}
                    />
                  </Field>
                </div>

                <div className="gap-8 sm:gap-4 grid grid-cols-1 sm:grid-cols-5">
                  <Field className="sm:col-span-3">
                    <Label>Geboortedatum</Label>
                    <Input
                      name="dateOfBirth"
                      type="date"
                      invalid={!!result?.validationErrors?.dateOfBirth}
                      defaultValue={getInputValue("dateOfBirth")}
                      required
                    />
                  </Field>
                </div>

                <div className="gap-8 sm:gap-4 grid grid-cols-1 sm:grid-cols-2">
                  <Field>
                    <Label>Geboorteplaats</Label>
                    <Input
                      name="birthCity"
                      invalid={!!result?.validationErrors?.birthCity}
                      defaultValue={getInputValue("birthCity")}
                    />
                  </Field>
                  <Field>
                    <Label>Geboorteland</Label>
                    <Combobox
                      name="birthCountry"
                      invalid={!!result?.validationErrors?.birthCountry}
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
                      defaultValue={getInputValue("birthCountry")}
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
