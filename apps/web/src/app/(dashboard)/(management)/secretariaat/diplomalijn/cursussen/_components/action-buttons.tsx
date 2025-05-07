"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
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
import { copyCurriculumAction } from "~/app/_actions/secretariat/copy-curriculum-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";

export function CopyCurriculum({ curriculumId }: { curriculumId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const closeDialog = () => {
    setIsOpen(false);
    reset();
  };

  const { execute, input, reset } = useAction(
    copyCurriculumAction.bind(null, curriculumId),
    {
      onSuccess: ({ data }) => {
        closeDialog();
        toast.success(`Curriculum ${data?.id} aangemaakt`);
      },
      onError: () => {
        toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  const { getInputValue } = useFormInput(input);

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>
        Kopie maken
      </Button>
      <Alert open={isOpen} onClose={closeDialog}>
        <form action={execute}>
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
              defaultValue={getInputValue("revision")}
            />
          </AlertBody>
          <AlertActions>
            <Button plain onClick={closeDialog}>
              Sluiten
            </Button>
            <Button type="submit">Kopieren</Button>
          </AlertActions>
        </form>
      </Alert>
    </>
  );
}
