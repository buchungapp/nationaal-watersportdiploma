"use client";

import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
  Alert,
  AlertActions,
  AlertBody,
  AlertDescription,
  AlertTitle,
} from "~/app/(dashboard)/_components/alert";
import { Button } from "~/app/(dashboard)/_components/button";
import { Input } from "~/app/(dashboard)/_components/input";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updatePersonEmailAction } from "~/app/_actions/person/update-person-email-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";

export function ChangeEmail({
  personId,
  open,
  onClose,
}: {
  personId: string;
  open: boolean;
  onClose: () => void;
}) {
  const closeDialog = () => {
    onClose();
    reset();
  };

  const { execute, result, input, reset } = useAction(
    updatePersonEmailAction.bind(null, undefined, personId),
    {
      onSuccess: () => {
        toast.success("E-mailadres bijgewerkt.");
        closeDialog();
      },
      onError: () => {
        toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  const { getInputValue } = useFormInput(input);

  return (
    <>
      <Alert open={open} onClose={closeDialog} size="md">
        <form action={execute}>
          <AlertTitle>Nieuw e-mailadres</AlertTitle>
          <AlertDescription>
            Dit wijzigt enkel het e-mailadres van deze persoon, niet van andere
            personen die onder het account vallen.
          </AlertDescription>
          <AlertBody>
            <Input
              name="email"
              type="email"
              aria-label="E-mail"
              invalid={!!result.validationErrors?.email}
              defaultValue={getInputValue("email")}
            />
          </AlertBody>
          <AlertActions>
            <Button plain onClick={closeDialog}>
              Annuleren
            </Button>
            <Button type="submit">Bevestigen</Button>
          </AlertActions>
        </form>
      </Alert>
    </>
  );
}
