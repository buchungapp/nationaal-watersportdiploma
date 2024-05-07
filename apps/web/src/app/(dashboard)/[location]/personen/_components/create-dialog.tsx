"use client";
import { useRef, useState } from "react";
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

interface Props {
  locationId: string;
}

export default function Wrapper(props: Props) {
  const forceRerenderId = useRef(0);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CreateDialog
      key={String(forceRerenderId.current)}
      {...props}
      isOpen={isOpen}
      setIsOpen={(next) => {
        setIsOpen(next);
        forceRerenderId.current += 1;
      }}
    />
  );
}

function CreateDialog({
  locationId,
  isOpen,
  setIsOpen,
}: Props & { isOpen: boolean; setIsOpen: (value: boolean) => void }) {
  const submit = async (prevState: unknown, formData: FormData) => {
    formData.append("locationId", locationId);
    const result = await createPerson(prevState, formData);

    if (result.message === "Success") {
      setIsOpen(false);
    }

    return result;
  };

  const [state, formAction] = useFormState(submit, undefined);

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
                      invalid={!!state?.errors.firstName}
                      required
                      minLength={1}
                      disabled={state?.message === "Success"}
                    />
                  </Field>
                  <Field>
                    <Label>Tussenvoegsel</Label>
                    <Input
                      name="lastNamePrefix"
                      invalid={!!state?.errors.lastNamePrefix}
                      disabled={state?.message === "Success"}
                    />
                  </Field>
                  <Field>
                    <Label>Achternaam</Label>
                    <Input
                      name="lastName"
                      invalid={!!state?.errors.lastName}
                      required
                      minLength={1}
                      disabled={state?.message === "Success"}
                    />
                  </Field>
                </div>

                <Field>
                  <Label>E-mail</Label>
                  <Input
                    name="email"
                    type="email"
                    invalid={!!state?.errors.email}
                    required
                    disabled={state?.message === "Success"}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-4">
                  <Field>
                    <Label>Geboortedatum</Label>
                    <Input
                      name="dateOfBirth"
                      type="date"
                      invalid={!!state?.errors.dateOfBirth}
                      required
                      disabled={state?.message === "Success"}
                    />
                  </Field>
                  <Field>
                    <Label>Geboorteplaats</Label>
                    <Input
                      name="birthCity"
                      invalid={!!state?.errors.birthCity}
                      disabled={state?.message === "Success"}
                    />
                  </Field>
                  <Field>
                    <Label>Geboorteland</Label>
                    <Input
                      name="birthCountry"
                      invalid={!!state?.errors.birthCountry}
                      placeholder="nl"
                      required
                      minLength={2}
                      maxLength={2}
                      disabled={state?.message === "Success"}
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
