"use client";

import { useAction } from "next-safe-action/hooks";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import type { Program } from "~/app/(dashboard)/(account)/profiel/[handle]/_components/progress/programs";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { ErrorMessage } from "~/app/(dashboard)/_components/fieldset";
import { removeStudentCurriculaAction } from "~/app/_actions/student-curriculum/remove-student-curricula-action";
import Spinner from "~/app/_components/spinner";

export function RemoveStudentCurriculumDialog({
  studentCurriculumId,
  open,
  onClose,
}: {
  studentCurriculumId: Program["id"];
  open: boolean;
  onClose: () => void;
}) {
  const { execute, hasErrored } = useAction(
    removeStudentCurriculaAction.bind(null, [studentCurriculumId]),
    {
      onSuccess: () => {
        onClose();
        toast.success("Programma verwijderd.");
      },
      onError: () => {
        toast.error("Er is iets misgegaan.");
      },
    },
  );

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        Weet je zeker dat dit programma wilt verwijderen?
      </DialogTitle>
      <form action={execute}>
        <DialogBody>
          Dit kan niet ongedaan worden gemaakt.
          {hasErrored ? (
            <ErrorMessage>
              Het programma kon niet verwijderd worden. Het kan zijn dat er ooit
              een diploma voor dit programma is uitgereikt. Neem contact op met
              de systeembeheerder.
            </ErrorMessage>
          ) : null}
        </DialogBody>
        <DialogActions>
          <Button plain onClick={onClose}>
            Sluiten
          </Button>

          <SubmitButton />
        </DialogActions>
      </form>
    </Dialog>
  );
}

function SubmitButton({ invalid }: { invalid?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button color="red" disabled={pending || invalid} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Verwijderen
    </Button>
  );
}
