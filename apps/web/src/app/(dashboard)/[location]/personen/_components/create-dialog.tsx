"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "~/app/(dashboard)/_components/button";
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
import { createPerson } from "../_actions/create";

export default function CreateDialog() {
  let [isOpen, setIsOpen] = useState(false);

  const [state, formAction] = useFormState(createPerson, {
    message: "",
    errors: {},
  });

  console.log(state);

  return (
    <>
      <Button
        color="branding-dark"
        type="button"
        onClick={() => setIsOpen(true)}
        className={"whitespace-nowrap"}
      >
        Persoon toevoegen
      </Button>
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
                      invalid={!!state.errors["firstName"]}
                    />
                  </Field>
                  <Field>
                    <Label>Tussenvoegsel</Label>
                    <Input
                      name="lastNamePrefix"
                      invalid={!!state.errors["lastNamePrefix"]}
                    />
                  </Field>
                  <Field>
                    <Label>Achternaam</Label>
                    <Input
                      name="lastName"
                      invalid={!!state.errors["lastName"]}
                    />
                  </Field>
                </div>

                <Field>
                  <Label>E-mail</Label>
                  <Input
                    name="email"
                    type="email"
                    invalid={!!state.errors["email"]}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-4">
                  <Field>
                    <Label>Geboortedatum</Label>
                    <Input
                      name="dateOfBirth"
                      type="date"
                      invalid={!!state.errors["dateOfBirth"]}
                    />
                  </Field>
                  <Field>
                    <Label>Geboorteplaats</Label>
                    <Input
                      name="birthCity"
                      invalid={!!state.errors["birthCity"]}
                    />
                  </Field>
                  <Field>
                    <Label>Geboorteland</Label>
                    <Input
                      name="birthCountry"
                      invalid={!!state.errors["birthCountry"]}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </Fieldset>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={() => setIsOpen(false)}>
              Sluiten
            </Button>
            {state.message === "Success" ? (
              <Button
                color="branding-dark"
                onClick={() => {
                  setIsOpen(false);
                }}
              >
                Sluiten
              </Button>
            ) : (
              <SubmitButton />
            )}
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
