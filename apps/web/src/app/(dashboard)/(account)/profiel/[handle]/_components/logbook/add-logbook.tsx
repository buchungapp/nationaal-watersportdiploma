"use client";
import { PlusIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Text } from "~/app/(dashboard)/_components/text";
import Spinner from "~/app/_components/spinner";
import { createLogbookAction } from "../../_actions/logbook";
import { LogbookFields } from "./logbook-fields";

export function AddLogbook({
  personId,
  className,
}: {
  personId: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => {
    setIsOpen(false);
  };

  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await createLogbookAction({ personId }, prevState, formData);

    if (result.message === "Success") {
      close();
      toast.success("Logboekregel toegevoegd.");
    }

    return result;
  };

  const [state, action] = useActionState(submit, undefined);

  return (
    <>
      <Button outline onClick={() => setIsOpen(true)} className={className}>
        <PlusIcon className="size-8" />
        <span className="hidden sm:inline">Voeg regel toe</span>
      </Button>

      <Dialog size="2xl" open={isOpen} onClose={close}>
        <DialogTitle>Voeg een nieuw regel toe</DialogTitle>
        <Text>Vul de details in van je vaaractiviteit.</Text>
        <form action={action}>
          <DialogBody className="@container/logbook-fields">
            <LogbookFields errors={state?.errors} />
          </DialogBody>
          <DialogActions>
            <Button plain onClick={close}>
              Sluiten
            </Button>
            <SubmitButton invalid={false} />
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

function SubmitButton({ invalid }: { invalid?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending || invalid} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Opslaan
    </Button>
  );
}
