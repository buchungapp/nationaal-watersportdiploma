"use client";
import { useAction } from "next-safe-action/hooks";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { updateLogbookAction } from "~/actions/logbook/update-logbook-action";
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
import { LogbookFields } from "./logbook-fields";
import type { LogbookType } from "./logbook-table";

export function EditLogbook({
  personId,
  logbook,
}: {
  personId: string;
  logbook: LogbookType;
}) {
  const { isOpen, close } = useDialog("edit-logbook");

  const { execute, result } = useAction(
    updateLogbookAction.bind(null, personId, logbook.id),
    {
      onSuccess: () => {
        close();
        toast.success("Logboekregel bijgewerkt.");
      },
    },
  );

  return (
    <Dialog size="2xl" open={isOpen} onClose={close}>
      <DialogTitle>Bewerk je logboekregel</DialogTitle>
      <Text>Vul de details in van je vaaractiviteit.</Text>
      <form action={execute}>
        <DialogBody className="@container/logbook-fields">
          <LogbookFields
            invalid={{
              startedAt: !!result?.validationErrors?.startedAt,
              endedAt: !!result?.validationErrors?.endedAt,
              departurePort: !!result?.validationErrors?.departurePort,
              arrivalPort: !!result?.validationErrors?.arrivalPort,
              location: !!result?.validationErrors?.location,
              windDirection: !!result?.validationErrors?.windDirection,
              windPower: !!result?.validationErrors?.windPower,
              boatType: !!result?.validationErrors?.boatType,
              boatLength: !!result?.validationErrors?.boatLength,
              sailedNauticalMiles:
                !!result?.validationErrors?.sailedNauticalMiles,
              sailedHoursInDark: !!result?.validationErrors?.sailedHoursInDark,
              primaryRole: !!result?.validationErrors?.primaryRole,
              crewNames: !!result?.validationErrors?.crewNames,
              conditions: !!result?.validationErrors?.conditions,
              additionalComments:
                !!result?.validationErrors?.additionalComments,
            }}
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
