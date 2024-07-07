"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import {
  Alert,
  AlertActions,
  AlertBody,
  AlertDescription,
  AlertTitle,
} from "~/app/(dashboard)/_components/alert";
import { Button } from "~/app/(dashboard)/_components/button";
import { Input } from "~/app/(dashboard)/_components/input";
import { updateEmail } from "../../_actions/create";

export function ChangeEmail({
  locationId,
  personId,
}: {
  personId: string;
  locationId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const updateEmailFormAction = updateEmail.bind(null, {
    locationId,
    personId,
  });

  const [state, action] = useFormState(updateEmailFormAction, undefined);

  //   TODO: this is ugly
  useEffect(() => {
    if (state?.state === "success") {
      setIsOpen(false);
    }
  }, [state]);

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>
        Email wijzigen
      </Button>
      <Alert open={isOpen} onClose={setIsOpen} size="md">
        <form action={action}>
          <AlertTitle>Nieuw e-mailadres</AlertTitle>
          <AlertDescription>
            Voer het nieuwe e-mailadres voor deze persoon in.
          </AlertDescription>
          <AlertBody>
            <Input name="email" type="email" aria-label="E-mail" />
          </AlertBody>
          <AlertActions>
            <Button plain onClick={() => setIsOpen(false)}>
              Annuleren
            </Button>
            <Button type="submit">Bevestigen</Button>
          </AlertActions>
        </form>
      </Alert>
    </>
  );
}
