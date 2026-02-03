"use client";
import { useAction } from "next-safe-action/hooks";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updateLogbookAction } from "~/app/_actions/logbook/update-logbook-action";
import Spinner from "~/app/_components/spinner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Text } from "~/app/(dashboard)/_components/text";
import { useDialog } from "~/app/(dashboard)/_hooks/use-dialog";
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

  const closeDialog = () => {
    close();
    reset();
  };

  const { execute, result, input, reset } = useAction(
    updateLogbookAction.bind(null, personId, logbook.id),
    {
      onSuccess: () => {
        close();
        toast.success("Logboekregel bijgewerkt.");
      },
    },
  );

  const { getInputValue } = useFormInput(input, logbook);

  return (
    <Dialog size="2xl" open={isOpen} onClose={closeDialog}>
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
              startedAt: getInputValue("startedAt"),
              endedAt: getInputValue("endedAt"),
              departurePort: getInputValue("departurePort"),
              arrivalPort: getInputValue("arrivalPort"),
              location: getInputValue("location"),
              windDirection: getInputValue("windDirection"),
              windPower: getInputValue("windPower"),
              boatType: getInputValue("boatType"),
              boatLength: getInputValue("boatLength"),
              sailedNauticalMiles: getInputValue("sailedNauticalMiles"),
              sailedHoursInDark: getInputValue("sailedHoursInDark"),
              primaryRole: getInputValue("primaryRole"),
              crewNames: getInputValue("crewNames"),
              conditions: getInputValue("conditions"),
              additionalComments: getInputValue("additionalComments"),
            }}
          />
        </DialogBody>
        <DialogActions>
          <Button plain onClick={closeDialog}>
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
