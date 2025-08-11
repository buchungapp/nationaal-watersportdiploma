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
import { updateUserDisplayNameAction } from "~/app/_actions/user/update-user-display-name-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";

export function ChangeDisplayName({
  userId,
  open,
  onClose,
}: {
  userId: string;
  open: boolean;
  onClose: () => void;
}) {
  const closeDialog = () => {
    onClose();
    reset();
  };

  const { execute, result, input, reset } = useAction(
    updateUserDisplayNameAction.bind(null, userId),
    {
      onSuccess: () => {
        toast.success("Naam bijgewerkt.");
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
          <AlertTitle>Nieuwe naam</AlertTitle>
          <AlertDescription>
            Dit wijzigt enkel de naam van dit account en niet van de personen
            die onder dit account vallen.
          </AlertDescription>
          <AlertBody>
            <Input
              name="displayName"
              type="text"
              aria-label="Naam"
              invalid={!!result.validationErrors?.displayName}
              defaultValue={getInputValue("displayName")}
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
