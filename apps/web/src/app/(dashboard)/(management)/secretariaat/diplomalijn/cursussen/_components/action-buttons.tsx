"use client";

import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/actions/safe-action";
import { copyCurriculumAction } from "~/actions/secretariat/copy-curriculum-action";
import {
  Alert,
  AlertActions,
  AlertBody,
  AlertDescription,
  AlertTitle,
} from "~/app/(dashboard)/_components/alert";
import { Button } from "~/app/(dashboard)/_components/button";
import { Input } from "~/app/(dashboard)/_components/input";

export function CopyCurriculum({ curriculumId }: { curriculumId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const { execute } = useAction(copyCurriculumAction.bind(null, curriculumId), {
    onSuccess: ({ data }) => {
      setIsOpen(false);
      toast.success(`Curriculum ${data?.id} aangemaakt`);
    },
    onError: () => {
      toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
    },
  });

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>
        Kopie maken
      </Button>
      <Alert open={isOpen} onClose={setIsOpen}>
        <form action={execute}>
          <AlertTitle>Curriculum kopiëren</AlertTitle>
          <AlertDescription>
            Deze actie kopieert alle onderdelen van het geselecteerde curriculum
            naar een nieuwe revisie. De nieuwe revisie wordt toegevoegd aan het
            programma, maar staat dan nog in concept.
          </AlertDescription>
          <AlertBody>
            <Input name="revision" required />
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
