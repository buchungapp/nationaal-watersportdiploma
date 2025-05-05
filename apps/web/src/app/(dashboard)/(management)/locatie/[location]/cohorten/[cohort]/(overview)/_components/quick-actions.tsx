"use client";
import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid";
import {
  type InferUseActionHookReturn,
  useAction,
} from "next-safe-action/hooks";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { removeCohortAction } from "~/actions/cohort/remove-cohort-action";
import { updateCohortAction } from "~/actions/cohort/update-cohort-action";
import { useFormInput } from "~/actions/hooks/useFormInput";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/actions/safe-action";
import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
} from "~/app/(dashboard)/_components/alert";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import {
  ErrorMessage,
  Field,
  FieldGroup,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { Strong } from "~/app/(dashboard)/_components/text";
import Spinner from "~/app/_components/spinner";
import dayjs from "~/lib/dayjs";

interface Props {
  cohort: {
    id: string;
    label: string;
    accessStartTime: string;
    accessEndTime: string;
  };
}

export function CohortActions(props: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState<string | null>(null);

  return (
    <div className="flex justify-center items-center">
      <Dropdown>
        <DropdownButton outline className="-my-1.5">
          <EllipsisHorizontalIcon />
        </DropdownButton>
        <DropdownMenu anchor="bottom end">
          <DropdownItem onClick={() => setIsDialogOpen("edit")}>
            <DropdownLabel>Wijzig</DropdownLabel>
          </DropdownItem>
          <DropdownItem onClick={() => setIsDialogOpen("remove")}>
            <DropdownLabel>Verwijder</DropdownLabel>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <EditCohortDialog
        {...props}
        isOpen={isDialogOpen === "edit"}
        close={() => setIsDialogOpen(null)}
      />

      <RemoveCohortDialog
        {...props}
        isOpen={isDialogOpen === "remove"}
        close={() => setIsDialogOpen(null)}
      />
    </div>
  );
}

function updateCohortErrorMessage(
  error: InferUseActionHookReturn<typeof updateCohortAction>["result"],
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

function EditCohortDialog({
  isOpen,
  cohort,
  close,
}: Props & {
  isOpen: boolean;
  close: () => void;
}) {
  const closeDialog = () => {
    close();
    reset();
  };

  const { execute, result, input, reset } = useAction(
    updateCohortAction.bind(null, cohort.id),
    {
      onSuccess: () => {
        toast.success("Cohort bijgewerkt");
        closeDialog();
      },
    },
  );

  const { getInputValue } = useFormInput(input, cohort);

  const errorMessage = updateCohortErrorMessage(result);

  return (
    <Dialog open={isOpen} onClose={closeDialog} size="2xl">
      <DialogTitle>Cohort bewerken</DialogTitle>
      <DialogDescription>Pas de gegevens van dit cohort aan.</DialogDescription>
      <form action={execute}>
        <DialogBody>
          <Fieldset>
            <FieldGroup>
              <div className="gap-8 sm:gap-4 grid grid-cols-1 sm:grid-cols-2">
                <Field className="col-span-2">
                  <Label>Naam</Label>
                  <Input
                    name="label"
                    required
                    minLength={1}
                    defaultValue={getInputValue("label")}
                  />
                </Field>
                <Field>
                  <Label>Opent op</Label>
                  <Input
                    name="accessStartTime"
                    type="datetime-local"
                    defaultValue={
                      getInputValue("accessStartTime")
                        ? dayjs(getInputValue("accessStartTime"))
                            .toISOString()
                            .split(".")[0]
                        : undefined
                    }
                    required
                  />
                </Field>
                <Field>
                  <Label>Sluit op</Label>
                  <Input
                    name="accessEndTime"
                    type="datetime-local"
                    defaultValue={
                      getInputValue("accessEndTime")
                        ? dayjs(getInputValue("accessEndTime"))
                            .toISOString()
                            .split(".")[0]
                        : undefined
                    }
                    required
                  />
                </Field>
              </div>
            </FieldGroup>

            {errorMessage ? <ErrorMessage>{errorMessage}</ErrorMessage> : null}
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

function removeCohortErrorMessage(
  error: InferUseActionHookReturn<typeof removeCohortAction>["result"],
) {
  if (error.serverError) {
    return error.serverError;
  }

  if (error.bindArgsValidationErrors || error.validationErrors) {
    return DEFAULT_SERVER_ERROR_MESSAGE;
  }

  return null;
}

function RemoveCohortDialog({
  isOpen,
  cohort,
  close,
}: Props & {
  isOpen: boolean;
  close: () => void;
}) {
  const router = useRouter();
  const params = useParams();

  const { execute, result, isPending } = useAction(
    removeCohortAction.bind(null, cohort.id),
    {
      onSuccess: () => {
        close();
        router.push(`/locatie/${params.location as string}/cohorten`);
      },
    },
  );

  const errorMessage = removeCohortErrorMessage(result);

  return (
    <Alert open={isOpen} onClose={close} size="md">
      <AlertTitle>Cohort verwijderen</AlertTitle>
      <AlertDescription>
        Weet je zeker dat je dit cohort wilt verwijderen? Dit verwijdert alle
        voortgang, en kan niet ongedaan worden gemaakt.{" "}
        <Strong>Reeds uitgegeven diploma's blijven bestaan.</Strong>
      </AlertDescription>
      {errorMessage ? <ErrorMessage>{errorMessage}</ErrorMessage> : null}

      <AlertActions>
        <Button plain onClick={close}>
          Annuleren
        </Button>
        <Button color="red" disabled={isPending} onClick={() => execute()}>
          {isPending ? <Spinner className="text-white" /> : null} Verwijderen
        </Button>
      </AlertActions>
    </Alert>
  );
}
