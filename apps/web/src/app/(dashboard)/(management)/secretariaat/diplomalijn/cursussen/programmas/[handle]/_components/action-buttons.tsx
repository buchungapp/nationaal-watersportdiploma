"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import {
  Alert,
  AlertActions,
  AlertBody,
  AlertDescription,
  AlertTitle,
} from "~/app/(dashboard)/_components/alert";
import { Button } from "~/app/(dashboard)/_components/button";
import { ErrorMessage } from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { copyCurriculumAction } from "../_actions/mutations";

export function CopyCurriculum({ curriculumId }: { curriculumId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const actionWithId = copyCurriculumAction.bind(null, { curriculumId });

  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await actionWithId(prevState, formData);

    if (!!result.id) {
      setIsOpen(false);
      toast.success(`Curriculum ${result.id} aangemaakt`);
    } else {
      toast.error("Er is iets misgegaan");
    }

    return result;
  };

  const [state, action] = useFormState(submit, undefined);

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>
        Kopie maken
      </Button>
      <Alert open={isOpen} onClose={setIsOpen}>
        <form action={action}>
          <AlertTitle>Curriculum kopiëren</AlertTitle>
          <AlertDescription>
            Deze actie kopieert alle onderdelen van het geselecteerde curriculum
            naar een nieuwe revisie. De nieuwe revisie wordt toegevoegd aan het
            programma, maar staat dan nog in concept.
          </AlertDescription>
          <AlertBody>
            <Input
              name="revision"
              required
              invalid={!!state?.errors.revision}
            />
            {state?.errors.revision && (
              <ErrorMessage>{state.errors.revision}</ErrorMessage>
            )}
          </AlertBody>
          <AlertActions>
            <Button plain onClick={() => setIsOpen(false)}>
              Sluiten
            </Button>
            <Button type="submit">Kopieren</Button>
          </AlertActions>
        </form>
      </Alert>
    </>
  );
}
