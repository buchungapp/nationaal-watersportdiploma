"use client";

import { ArrowRightIcon } from "@heroicons/react/16/solid";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updatePersonDetailsAction } from "~/app/_actions/person/update-person-details-action";
import Spinner from "~/app/_components/spinner";
import { Button, TextButton } from "~/app/(dashboard)/_components/button";
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
  Field,
  FieldGroup,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";

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
    birthCountry: person.birthCountry
      ? {
          code: person.birthCountry.code,
        }
      : null,
  });

  return (
    <>
      <TextButton onClick={() => setIsOpen(true)}>
        Bewerk gegevens <ArrowRightIcon />
      </TextButton>

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
                      invalid={
                        result?.validationErrors &&
                        "birthCountry" in result.validationErrors &&
                        !!result.validationErrors.birthCountry
                      }
                      options={countries}
                      displayValue={(value) => value?.name}
                      defaultValue={
                        countries.find(
                          (c) => c.code === getInputValue("birthCountry")?.code,
                        ) ?? undefined
                      }
                    >
                      {(country) => (
                        <ComboboxOption key={country.code} value={country}>
                          <ComboboxLabel>{country.name}</ComboboxLabel>
                        </ComboboxOption>
                      )}
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
