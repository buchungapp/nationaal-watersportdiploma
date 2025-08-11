"use client";

import { useAction } from "next-safe-action/hooks";
import type { PropsWithChildren } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import { updateUserAction } from "~/app/_actions/user/update-user-action";
import Spinner from "~/app/_components/spinner";

export function AccountForm({ children }: PropsWithChildren) {
  const { execute } = useAction(updateUserAction.bind(null, undefined), {
    onSuccess: () => {
      toast.success("Profiel bijgewerkt!");
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Er is een fout opgetreden");
    },
  });

  return <form action={execute}>{children}</form>;
}

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" color="branding-light" disabled={pending}>
      {pending ? <Spinner className="text-white" /> : null}
      Opslaan
    </Button>
  );
}
