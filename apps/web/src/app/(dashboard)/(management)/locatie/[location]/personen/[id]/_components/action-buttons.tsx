"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
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
import { updateEmail, updatePerson } from "../../_actions/create";

export function ChangeEmail({
  locationId,
  personId,
}: {
  personId: string;
  locationId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const submit = async (_previous: unknown, formData: FormData) => {
    const res = await updateEmail(
      { locationId, personId },
      undefined,
      formData,
    );

    if (res.state === "success") {
      setIsOpen(false);
    }
    return res;
  };

  const [_state, action] = useFormState(submit, undefined);

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>
        E-mail wijzigen
      </Button>
      <Alert open={isOpen} onClose={setIsOpen} size="md">
        <form action={action}>
          <AlertTitle>Nieuw e-mailadres</AlertTitle>
          <AlertDescription>
            Voer het nieuwe e-mailadres voor deze persoon in. <br />
            <Strong>
              Let op: dit wijzigt het e-mailadres voor{" "}
              <span className="underline underline-offset-1">alle</span>{" "}
              personen die op dit moment dit e-mailadres gebruiken!
            </Strong>
          </AlertDescription>
          <AlertBody>
            <Input name="email" type="email" aria-label="E-mail" />
          </AlertBody>
          <AlertActions>
            <Button plain onClick={() => setIsOpen(false)}>
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

  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await updatePerson(
      { locationId, personId: person.id },
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
      <Button type="button" onClick={() => setIsOpen(true)} outline>
        Personalia wijzigen
      </Button>
      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>Personalia wijzigen</DialogTitle>
        <DialogDescription>
          <Strong>Let op:</Strong> deze wijzigingen zijn zichtbaar voor zowel de
          persoon zelf, als alle NWD-vaarlocatie waarmee deze persoon een link
          heeft.
        </DialogDescription>
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
