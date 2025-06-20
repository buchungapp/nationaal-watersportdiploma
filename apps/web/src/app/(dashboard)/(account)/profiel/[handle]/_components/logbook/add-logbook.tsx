"use client";
import { PlusIcon } from "@heroicons/react/16/solid";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
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
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { createLogbookAction } from "~/app/_actions/logbook/create-logbook-action";
import Spinner from "~/app/_components/spinner";
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
    reset();
  };

  const { execute, result, input, reset } = useAction(
    createLogbookAction.bind(null, personId),
    {
      onSuccess: () => {
        close();
        toast.success("Logboekregel toegevoegd.");
      },
    },
  );

  const { getInputValue } = useFormInput(input);

  return (
    <>
      <Button outline onClick={() => setIsOpen(true)} className={className}>
        <PlusIcon className="size-8" /> Voeg regel toe
      </Button>

      <Dialog size="2xl" open={isOpen} onClose={close}>
        <DialogTitle>Voeg een nieuw regel toe</DialogTitle>
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
                sailedHoursInDark:
                  !!result?.validationErrors?.sailedHoursInDark,
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
