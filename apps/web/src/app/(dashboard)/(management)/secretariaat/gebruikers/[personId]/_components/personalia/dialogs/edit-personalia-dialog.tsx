"use client";

import { useAction } from "next-safe-action/hooks";
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
import { Strong } from "~/app/(dashboard)/_components/text";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updatePersonDetailsAction } from "~/app/_actions/person/update-person-details-action";
import Spinner from "~/app/_components/spinner";

export function EditPersonaliaDialog({
  person,
  countries,
  open,
  onClose,
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
  open: boolean;
  onClose: () => void;
}) {
  const closeDialog = () => {
    onClose();
    reset();
  };

  const { execute, result, input, reset } = useAction(
    updatePersonDetailsAction.bind(null, person.id, undefined),
    {
      onSuccess: () => {
        toast.success("Gegevens bijgewerkt.");
        closeDialog();
      },
    },
  );

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
      <Dialog open={open} onClose={closeDialog}>
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
                      options={countries}
                      displayValue={(country) => country?.name}
                      defaultValue={countries.find(
                        (country) =>
                          country.code === getInputValue("birthCountry")?.code,
                      )}
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
