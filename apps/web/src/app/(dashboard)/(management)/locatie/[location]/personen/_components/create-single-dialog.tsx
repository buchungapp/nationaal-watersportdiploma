"use client";

import { useAction } from "next-safe-action/hooks";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
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
  Description,
  ErrorMessage,
  Field,
  FieldGroup,
  Fieldset,
  Label,
  Legend,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { Text } from "~/app/(dashboard)/_components/text";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { createPersonForLocationAction } from "~/app/_actions/person/create-person-action";
import Spinner from "~/app/_components/spinner";
import type { LocationActorType } from "~/lib/nwd";

const ROLES: {
  type: LocationActorType;
  label: string;
  description: string;
  defaultChecked?: boolean;
}[] = [
  {
    type: "student",
    label: "Cursist",
    description: "Kan toegevoegd worden aan cohorten.",
    defaultChecked: true,
  },
  {
    type: "instructor",
    label: "Instructeur",
    description:
      "Geeft lessen, kan toegevoegd worden aan cohorten en kan de diplomalijn inzien.",
  },
  {
    type: "location_admin",
    label: "Locatiebeheerder",
    description: "Heeft alle rechten, kan de locatie en cohorten beheren.",
  },
] as const;

interface Props {
  locationId: string;
  countries: { code: string; name: string }[];
  isOpen: boolean;
  close: () => void;
}

export default function Wrapper(props: Props) {
  const forceRerenderId = useRef(0);

  return (
    <CreateDialog
      key={String(forceRerenderId.current)}
      {...props}
      isOpen={props.isOpen}
      close={() => {
        props.close();
        forceRerenderId.current += 1;
      }}
    />
  );
}

function CreateDialog({ locationId, isOpen, close, countries }: Props) {
  const closeDialog = () => {
    close();
    reset();
  };

  const { execute, result, input, reset } = useAction(
    createPersonForLocationAction.bind(null, locationId),
    {
      onSuccess: () => {
        closeDialog();
        toast.success("Persoon is toegevoegd.");
      },
      onError: ({ error, input }) => {
        if (input instanceof FormData) {
          console.log(Object.fromEntries(input.entries()));
        } else {
          console.log("input is not a FormData", input);
        }
        console.error("Error: ", error);
        toast.error("Er is iets misgegaan bij het toevoegen van de persoon.");
      },
    },
  );
  const { getInputValue } = useFormInput(input, {
    birthCountry: {
      code: "nl",
    },
    ...ROLES.reduce(
      (acc, role) => {
        acc[`role-${role.type}`] =
          "defaultChecked" in role && role.defaultChecked ? "on" : "off";
        return acc;
      },
      {} as Record<string, string>,
    ),
  });

  return (
    <>
      <Dialog open={isOpen} onClose={closeDialog}>
        <DialogTitle>Persoon toevoegen</DialogTitle>
        <DialogDescription>
          Vul de gegevens in om een persoon toe te voegen.
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

                <div className="gap-8 sm:gap-4 grid grid-cols-1 sm:grid-cols-5">
                  <Field className="sm:col-span-3">
                    <Label>E-mail</Label>
                    <Input
                      name="email"
                      type="email"
                      invalid={!!result.validationErrors?.email}
                      required
                      defaultValue={getInputValue("email")}
                    />
                  </Field>
                  <Field className="sm:col-span-2">
                    <Label>Geboortedatum</Label>
                    <Input
                      name="dateOfBirth"
                      type="date"
                      invalid={!!result.validationErrors?.dateOfBirth}
                      required
                      defaultValue={getInputValue("dateOfBirth")}
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

            <Fieldset className="mt-6">
              <Legend>Rollen</Legend>
              <Text>
                Welke rol(len) vervult deze persoon in jullie locatie?
              </Text>
              {!!result.validationErrors?.roles && (
                <ErrorMessage>
                  Selecteer minimaal één rol voor de persoon.
                </ErrorMessage>
              )}
              <CheckboxGroup>
                {ROLES.map((role) => (
                  <CheckboxField key={role.type}>
                    <Checkbox
                      name={`role-${role.type}`}
                      defaultChecked={
                        getInputValue(`role-${role.type}`) === "on"
                      }
                    />
                    <Label>{role.label}</Label>
                    <Description>{role.description}</Description>
                  </CheckboxField>
                ))}
              </CheckboxGroup>
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
