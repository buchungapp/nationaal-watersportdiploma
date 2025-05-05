"use client";
import { useAction } from "next-safe-action/hooks";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { removeLogbookAction } from "~/actions/logbook/remove-logbook-action";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { useDialog } from "~/app/(dashboard)/_hooks/use-dialog";
import Spinner from "~/app/_components/spinner";
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

  const { execute } = useAction(
    removeLogbookAction.bind(null, personId, logbookId),
    {
      onSuccess: () => {
        close();
        toast.success("Logboek regels verwijderd.");
        onSuccess?.();
      },
    },
  );

  return (
    <Dialog open={isOpen} onClose={close}>
      <DialogTitle>
        Weet je zeker dat je deze regels wilt verwijderen?
      </DialogTitle>
      <form action={execute}>
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
