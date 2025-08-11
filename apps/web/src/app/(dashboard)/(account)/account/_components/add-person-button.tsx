"use client";

import { PlusIcon } from "@heroicons/react/16/solid";
import { useAction } from "next-safe-action/hooks";
import { Suspense, use, useState } from "react";
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
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { createPersonForUserAction } from "~/app/_actions/person/create-person-action";
import Spinner from "~/app/_components/spinner";

interface Props {
  countriesPromise: Promise<{ code: string; name: string }[]>;
  userPromise?: Promise<{ authUserId: string }>;
}

export function AddPersonButton({ countriesPromise, userPromise }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        outline
        className="whitespace-nowrap"
        onClick={() => setIsDialogOpen(true)}
      >
        <PlusIcon />
        Profiel toevoegen
      </Button>

      {isDialogOpen && (
        <Suspense fallback={null}>
          <CreatePersonDialogWrapper
            countriesPromise={countriesPromise}
            userPromise={userPromise}
            isOpen={isDialogOpen}
            close={() => setIsDialogOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}

function CreatePersonDialogWrapper({
  countriesPromise,
  isOpen,
  close,
  userPromise,
}: {
  countriesPromise: Promise<{ code: string; name: string }[]>;
  isOpen: boolean;
  close: () => void;
  userPromise: Promise<{ authUserId: string }> | undefined;
}) {
  const user = userPromise ? use(userPromise) : undefined;
  const countries = use(countriesPromise);

  return (
    <CreatePersonDialog
      countries={countries}
      isOpen={isOpen}
      close={close}
      userId={user?.authUserId}
    />
  );
}

function CreatePersonDialog({
  countries,
  isOpen,
  close,
  userId,
}: {
  countries: { code: string; name: string }[];
  isOpen: boolean;
  close: () => void;
  userId: string | undefined;
}) {
  const closeDialog = () => {
    close();
    reset();
  };

  const { execute, result, input, reset } = useAction(
    createPersonForUserAction.bind(null, userId),
    {
      onSuccess: () => {
        closeDialog();
        toast.success("Profiel is toegevoegd.");
      },
      onError: ({ error, input }) => {
        if (input instanceof FormData) {
          console.log(Object.fromEntries(input.entries()));
        } else {
          console.log("input is not a FormData", input);
        }
        console.error("Error: ", error);
        toast.error("Er is iets misgegaan bij het toevoegen van het profiel.");
      },
    },
  );

  const { getInputValue } = useFormInput(input, {
    birthCountry: {
      code: "nl",
    },
  });

  return (
    <>
      <Dialog open={isOpen} onClose={closeDialog}>
        <DialogTitle>Profiel toevoegen</DialogTitle>
        <DialogDescription>
          Vul de gegevens in om een nieuw profiel toe te voegen aan jouw
          account.
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
                      required
                      minLength={1}
                      defaultValue={getInputValue("firstName")}
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
                      required
                      minLength={1}
                      defaultValue={getInputValue("lastName")}
                    />
                  </Field>
                </div>

                <div className="gap-8 sm:gap-4 grid grid-cols-1 sm:grid-cols-2">
                  <Field>
                    <Label>Geboortedatum</Label>
                    <Input
                      name="dateOfBirth"
                      type="date"
                      invalid={!!result.validationErrors?.dateOfBirth}
                      required
                      defaultValue={getInputValue("dateOfBirth")}
                    />
                  </Field>
                  <Field>
                    <Label>Geboorteplaats</Label>
                    <Input
                      name="birthCity"
                      invalid={!!result.validationErrors?.birthCity}
                      required
                      defaultValue={getInputValue("birthCity")}
                    />
                  </Field>
                </div>

                <div className="gap-8 sm:gap-4 grid grid-cols-1 sm:grid-cols-2">
                  <Field>
                    <Label>Geboorteland</Label>
                    <Combobox
                      name="birthCountry"
                      invalid={!!result.validationErrors?.birthCountry}
                      options={countries}
                      displayValue={(value) => value?.name}
                      defaultValue={countries.find(
                        (c) => c.code === getInputValue("birthCountry")?.code,
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
