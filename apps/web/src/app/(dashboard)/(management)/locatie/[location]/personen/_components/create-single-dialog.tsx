"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
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
import Spinner from "~/app/_components/spinner";
import { createPerson } from "../_actions/create";

interface Props {
  locationId: string;
  countries: { code: string; name: string }[];
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

function CreateDialog({ locationId, isOpen, setIsOpen, countries }: Props) {
  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await createPerson(locationId, prevState, formData);

    if (result.message === "Success") {
      setIsOpen(false);
      toast.success("Persoon is toegevoegd.");
    }

    return result;
  };

  const [state, formAction] = useActionState(submit, undefined);
  const [selectedCountry, setSelectedCountry] = useState<string | null>("nl");

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
      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>Persoon toevoegen</DialogTitle>
        <DialogDescription>
          Vul de gegevens in om een persoon toe te voegen.
        </DialogDescription>
        <form action={formAction}>
          <DialogBody>
            <Fieldset>
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
      {pending ? <Spinner className="text-white" /> : null}
      Opslaan
    </Button>
  );
}
