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
import { Text } from "~/app/(dashboard)/_components/text";
import { useDialog } from "~/app/(dashboard)/_hooks/use-dialog";
import Spinner from "~/app/_components/spinner";
import { updateLogbookAction } from "../../_actions/logbook";
import { LogbookFields } from "./logbook-fields";
import type { LogbookType } from "./logbook-table";

export function EditLogbook({
  personId,
  rows,
}: {
  personId: string;
  rows: LogbookType[];
}) {
  const { isOpen, close } = useDialog("edit-logbook");

  const logbook = rows[0];

  const submit = async (prevState: unknown, formData: FormData) => {
    if (!logbook) {
      return;
    }

    const result = await updateLogbookAction(
      { personId, logbookId: logbook.id },
      prevState,
      formData,
    );

    console.log(result);

    if (result.message === "Success") {
      close();
      toast.success("Logboekregel bijgewerkt.");
    }

    return result;
  };

  const [state, action] = useActionState(submit, undefined);

  if (rows.length !== 1 || !logbook) {
    return null;
  }

  return (
    <Dialog size="2xl" open={isOpen} onClose={close}>
      <DialogTitle>Bewerk je logboekregel</DialogTitle>
      <Text>Vul de details in van je vaaractiviteit.</Text>
      <form action={action}>
        <DialogBody className="@container/logbook-fields">
          <LogbookFields
            errors={state?.errors}
            defaultValues={{
              ...logbook,
            }}
          />
        </DialogBody>
        <DialogActions>
          <Button plain onClick={close}>
            Sluiten
          </Button>
          <SubmitButton invalid={false} />
        </DialogActions>
      </form>
    </Dialog>
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
