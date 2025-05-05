"use client";

import type { PropsWithChildren } from "react";
import { toast } from "sonner";

import { useAction } from "next-safe-action/hooks";
import { useFormStatus } from "react-dom";
import { updateLocationSocialsAction } from "~/actions/location/update-location-socials-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/actions/safe-action";
import { Button } from "~/app/(dashboard)/_components/button";
import Spinner from "~/app/_components/spinner";
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Opslaan
    </Button>
  );
}

export default function SocialsForm({
  children,
  className,
  locationId,
}: PropsWithChildren<{ className?: string; locationId: string }>) {
  const { execute } = useAction(
    updateLocationSocialsAction.bind(null, locationId),
    {
      onSuccess: () => {
        toast.success("Instellingen zijn geüpdatet.");
      },
      onError: () => {
        toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  return (
    <form className={className} action={execute}>
      {children}

      <div className="flex justify-end gap-4">
        <Button plain type="reset">
          Reset
        </Button>

        <SubmitButton />
      </div>
    </form>
  );
}
