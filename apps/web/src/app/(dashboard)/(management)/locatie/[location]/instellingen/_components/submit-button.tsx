"use client";
import { useFormStatus } from "react-dom";
import { Button } from "~/app/(dashboard)/_components/button";

export default function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      Opslaan
    </Button>
  );
}
