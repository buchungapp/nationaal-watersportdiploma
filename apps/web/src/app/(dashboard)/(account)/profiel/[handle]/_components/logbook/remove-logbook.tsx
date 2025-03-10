"use client";
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
import { useDialog } from "~/app/(dashboard)/_hooks/use-dialog";
import Spinner from "~/app/_components/spinner";
import { removeLogbookAction } from "../../_actions/logbook";
import type { LogbookType } from "./logbook-table";

export function RemoveLogbook({
  personId,
  logbookId,
  onSuccess,
}: {
  personId: string;
  logbookId: LogbookType["id"] | LogbookType["id"][];
  onSuccess?: () => void;
}) {
  const { isOpen, close } = useDialog("remove-logbook");

  const submit = async () => {
    const result = await removeLogbookAction({
      personId,
      logbookId,
    });

    if (result.message === "Success") {
      close();
      toast.success("Logboek regels verwijderd.");
      onSuccess?.();
    }

    return result;
  };

  const [_, action] = useActionState(submit, undefined);

  return (
    <Dialog open={isOpen} onClose={close}>
      <DialogTitle>
        Weet je zeker dat je deze regels wilt verwijderen?
      </DialogTitle>
      <form action={action}>
        <DialogBody>Dit kan niet ongedaan worden gemaakt.</DialogBody>
        <DialogActions>
          <Button plain onClick={close}>
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
