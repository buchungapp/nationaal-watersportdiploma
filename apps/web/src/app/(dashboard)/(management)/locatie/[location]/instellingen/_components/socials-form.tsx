"use client";

import { type PropsWithChildren, useActionState } from "react";
import { toast } from "sonner";
import { updateSocials } from "../_actions/update";

import { useFormStatus } from "react-dom";
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
  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await updateSocials(locationId, prevState, formData);
    if (result.message === "Success") {
      toast.success("Instellingen zijn geüpdatet.");
    } else {
      toast.error("Er is iets misgegaan");
    }
    return result;
  };

  const [_state, formAction] = useActionState(submit, undefined);

  return (
    <form className={className} action={formAction}>
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
