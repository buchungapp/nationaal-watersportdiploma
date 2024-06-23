"use client";

import { type PropsWithChildren } from "react";
import { useFormState as useActionState } from "react-dom";
import { toast } from "sonner";
import { updateSettings } from "../_actions/update";

export default function SettingsForm({
  children,
  className,
  locationId,
}: PropsWithChildren<{ className?: string; locationId: string }>) {
  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await updateSettings(locationId, prevState, formData);
    if (result.message === "Success") {
      toast.success("Instellingen zijn geüpdatet.");
    }
    return result;
  };

  const [state, formAction] = useActionState(submit, undefined);

  return (
    <form className={className} action={formAction}>
      {children}
    </form>
  );
}
