"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  Alert,
  AlertActions,
  AlertBody,
  AlertDescription,
  AlertTitle,
} from "~/app/(dashboard)/_components/alert";
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
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import {
  Field,
  FieldGroup,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { Strong } from "~/app/(dashboard)/_components/text";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updatePersonDetailsAction } from "~/app/_actions/person/update-person-details-action";
import { updatePersonEmailAction } from "~/app/_actions/person/update-person-email-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";

export function ChangeEmail({
  locationId,
  personId,
}: {
  personId: string;
  locationId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const closeDialog = () => {
    setIsOpen(false);
    reset();
  };

  const { execute, result, input, reset } = useAction(
    updatePersonEmailAction.bind(null, locationId, personId),
    {
      onSuccess: () => {
        toast.success("E-mailadres bijgewerkt.");
        closeDialog();
      },
      onError: () => {
        toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  const { getInputValue } = useFormInput(input);

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>
        E-mail wijzigen
      </Button>
      <Alert open={isOpen} onClose={closeDialog} size="md">
        <form action={execute}>
          <AlertTitle>Nieuw e-mailadres</AlertTitle>
          <AlertDescription>
            Dit wijzigt enkel het e-mailadres van deze persoon, niet van andere
            personen die onder het account vallen.
          </AlertDescription>
          <AlertBody>
            <Input
              name="email"
              type="email"
              aria-label="E-mail"
              invalid={!!result.validationErrors?.email}
              defaultValue={getInputValue("email")}
            />
          </AlertBody>
          <AlertActions>
            <Button plain onClick={closeDialog}>
              Annuleren
            </Button>
            <Button type="submit">Bevestigen</Button>
          </AlertActions>
        </form>
      </Alert>
    </>
  );
}

export function EditDetails({
  locationId,
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
  locationId: string;
  countries: { code: string; name: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  const closeDialog = () => {
    setIsOpen(false);
    reset();
  };

  const { execute, result, input, reset } = useAction(
    updatePersonDetailsAction.bind(null, person.id, locationId),
    {
      onSuccess: () => {
        toast.success("Gegevens bijgewerkt.");
        closeDialog();
      },
    },
  );

  const { getInputValue } = useFormInput(input, {
    ...person,
    birthCountry: person.birthCountry?.code ?? null,
  });

  const [selectedCountry, setSelectedCountry] = useState<string | null>(
    getInputValue("birthCountry") ?? null,
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
      <Button type="button" onClick={() => setIsOpen(true)} outline>
        Personalia wijzigen
      </Button>
      <Dialog open={isOpen} onClose={closeDialog}>
        <DialogTitle>Personalia wijzigen</DialogTitle>
        <DialogDescription>
          <Strong>Let op:</Strong> deze wijzigingen zijn zichtbaar voor zowel de
          persoon zelf, als alle NWD-vaarlocatie waarmee deze persoon een link
          heeft.
        </DialogDescription>
        <form action={execute}>
          <DialogBody>
            <Fieldset>
              <FieldGroup>
                <div className="gap-8 sm:gap-4 grid grid-cols-1 sm:grid-cols-3">
                  <Field>
                    <Label>Voornaam</Label>
                    <Input
                      name="firstName"
                      invalid={!!result.validationErrors?.firstName}
                      defaultValue={getInputValue("firstName")}
                      required
                      minLength={1}
                    />
                  </Field>
                  <Field>
                    <Label>Tussenvoegsel</Label>
                    <Input
                      name="lastNamePrefix"
                      invalid={!!result.validationErrors?.lastNamePrefix}
                      defaultValue={getInputValue("lastNamePrefix")}
                    />
                  </Field>
                  <Field>
                    <Label>Achternaam</Label>
                    <Input
                      name="lastName"
                      invalid={!!result.validationErrors?.lastName}
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
                      invalid={!!result.validationErrors?.dateOfBirth}
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
                      invalid={!!result.validationErrors?.birthCity}
                      defaultValue={getInputValue("birthCity")}
                    />
                  </Field>
                  <Field>
                    <Label>Geboorteland</Label>
                    <Combobox
                      name="birthCountry"
                      invalid={!!result.validationErrors?.birthCountry}
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
