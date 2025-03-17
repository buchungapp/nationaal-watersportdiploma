"use client";

import { useFormStatus } from "react-dom";
import { Button } from "~/app/(dashboard)/_components/button";
import Spinner from "~/app/_components/spinner";

export function SubmitButton({ invalid }: { invalid?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending || invalid} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Aanvragen
    </Button>
  );
}
