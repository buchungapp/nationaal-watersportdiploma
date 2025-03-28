"use client";
import { PlusIcon } from "@heroicons/react/16/solid";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import {
  ErrorMessage,
  Field,
  FieldGroup,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { SmartDatetimePicker } from "~/app/(dashboard)/_components/natural-language-input";
import Spinner from "~/app/_components/spinner";
import type { listPrograms } from "~/lib/nwd";
import { createCohortAction } from "../_actions/create";

interface Props {
  locationId: string;
  programs: Awaited<ReturnType<typeof listPrograms>>;
}

export default function Wrapper(props: Props) {
  const forceRerenderId = useRef(0);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CreateDialogClient
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

function CreateDialogClient({
  locationId,
  isOpen,
  setIsOpen,
}: Props & { isOpen: boolean; setIsOpen: (value: boolean) => void }) {
  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await createCohortAction(locationId, prevState, formData);

    if (result.message === "Success") {
      toast.success("Cohort toegevoegd");
      setIsOpen(false);
    }

    return result;
  };

  const [state, formAction] = useActionState(submit, undefined);

  return (
    <>
      <Button
        color="branding-orange"
        type="button"
        onClick={() => setIsOpen(true)}
        className="whitespace-nowrap"
      >
        <PlusIcon />
        Cohort toevoegen
      </Button>
      <Dialog open={isOpen} onClose={setIsOpen} size="2xl">
        <DialogTitle>Cohort toevoegen</DialogTitle>
        <DialogDescription>
          Vul de gegevens in om een nieuw cohort te starten.
        </DialogDescription>
        <form action={formAction}>
          <DialogBody>
            <Fieldset>
              <FieldGroup>
                <div className="gap-8 sm:gap-4 grid grid-cols-1 sm:grid-cols-2">
                  <Field className="col-span-2">
                    <Label>Naam</Label>
                    <Input
                      name="label"
                      invalid={!!state?.errors.label}
                      required
                      minLength={1}
                    />
                  </Field>
                  <Field className="relative max-sm:col-span-2">
                    <Label>Opent op</Label>
                    <SmartDatetimePicker
                      name="accessStartTime"
                      invalid={!!state?.errors.accessStartTime}
                      required
                    />
                  </Field>
                  <Field className="relative max-sm:col-span-2">
                    <Label>Sluit op</Label>
                    <SmartDatetimePicker
                      name="accessEndTime"
                      invalid={!!state?.errors.accessEndTime}
                      required
                    />
                  </Field>
                </div>
              </FieldGroup>

              {!!state?.errors && (
                <ErrorMessage>{JSON.stringify(state.errors)}</ErrorMessage>
              )}
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
