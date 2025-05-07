"use client";
import { PlusIcon } from "@heroicons/react/16/solid";
import {
  type InferUseActionHookReturn,
  useAction,
} from "next-safe-action/hooks";
import { useRef, useState } from "react";
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
import { createCohortAction } from "~/app/_actions/cohort/create-cohort-action";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
import dayjs from "~/lib/dayjs";
import type { listPrograms } from "~/lib/nwd";

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

function createCohortErrorMessage(
  error: InferUseActionHookReturn<typeof createCohortAction>["result"],
) {
  if (error.serverError) {
    return error.serverError;
  }

  if (error.validationErrors) {
    return "Een van de velden is niet correct ingevuld.";
  }

  if (error.bindArgsValidationErrors) {
    return DEFAULT_SERVER_ERROR_MESSAGE;
  }

  return null;
}

function CreateDialogClient({
  locationId,
  isOpen,
  setIsOpen,
}: Props & { isOpen: boolean; setIsOpen: (value: boolean) => void }) {
  const closeDialog = () => {
    setIsOpen(false);
    reset();
  };

  const { execute, result, input, reset } = useAction(
    createCohortAction.bind(null, locationId),
    {
      onSuccess: () => {
        toast.success("Cohort toegevoegd");
        closeDialog();
      },
    },
  );

  const { getInputValue } = useFormInput(input);

  const errorMessage = createCohortErrorMessage(result);

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
      <Dialog open={isOpen} onClose={closeDialog} size="2xl">
        <DialogTitle>Cohort toevoegen</DialogTitle>
        <DialogDescription>
          Vul de gegevens in om een nieuw cohort te starten.
        </DialogDescription>
        <form action={execute}>
          <DialogBody>
            <Fieldset>
              <FieldGroup>
                <div className="gap-8 sm:gap-4 grid grid-cols-1 sm:grid-cols-2">
                  <Field className="col-span-2">
                    <Label>Naam</Label>
                    <Input
                      name="label"
                      invalid={!!result?.validationErrors?.label}
                      required
                      minLength={1}
                      defaultValue={getInputValue("label")}
                    />
                  </Field>
                  <Field className="relative max-sm:col-span-2">
                    <Label>Opent op</Label>
                    <SmartDatetimePicker
                      name="accessStartTime"
                      invalid={!!result?.validationErrors?.accessStartTime}
                      required
                      defaultValue={
                        getInputValue("accessStartTime")
                          ? dayjs(getInputValue("accessStartTime")).toDate()
                          : undefined
                      }
                    />
                  </Field>
                  <Field className="relative max-sm:col-span-2">
                    <Label>Sluit op</Label>
                    <SmartDatetimePicker
                      name="accessEndTime"
                      invalid={!!result?.validationErrors?.accessEndTime}
                      required
                      defaultValue={
                        getInputValue("accessEndTime")
                          ? dayjs(getInputValue("accessEndTime")).toDate()
                          : undefined
                      }
                    />
                  </Field>
                </div>
              </FieldGroup>

              {errorMessage ? (
                <ErrorMessage>{errorMessage}</ErrorMessage>
              ) : null}
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
