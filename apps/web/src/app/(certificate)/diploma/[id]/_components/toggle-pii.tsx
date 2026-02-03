"use client";

import { EyeIcon, EyeSlashIcon } from "@heroicons/react/16/solid";
import { useParams, usePathname } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { showPersonallyIdentifiableInformationAction } from "~/app/_actions/certificate/show-personally-identifiable-information-action";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import {
  ErrorMessage,
  Field,
  FieldGroup,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";

function Submit() {
  const { pending } = useFormStatus();

  return (
    <Button type={"submit"} disabled={pending}>
      Bekijken
    </Button>
  );
}

function Form({ closeAndReset }: { closeAndReset: () => void }) {
  const params = useParams();

  const certificateId = params.id as string;

  const { execute, result, input } = useAction(
    showPersonallyIdentifiableInformationAction.bind(null, certificateId),
  );

  const { getInputValue } = useFormInput(input);

  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={execute}>
      <DialogBody>
        <FieldGroup>
          <div className="gap-8 sm:gap-4 grid grid-cols-1 sm:grid-cols-2">
            <Field>
              <Label>Datum van uitgifte</Label>
              <Input
                name="issuedDate"
                type="date"
                required
                defaultValue={getInputValue("issuedDate")}
              />
            </Field>
            <Field>
              <Label>Diplomanummer</Label>
              <Input
                name="handle"
                minLength={10}
                type="text"
                required
                defaultValue={getInputValue("handle")}
              />
            </Field>
          </div>
        </FieldGroup>
      </DialogBody>

      {result?.serverError ? (
        <div className="mt-2">
          <ErrorMessage>
            De ingevoerde gegevens komen niet overeen met het diploma.
          </ErrorMessage>
        </div>
      ) : null}

      <DialogActions>
        <Button plain onClick={closeAndReset}>
          Annuleer
        </Button>
        <Submit />
      </DialogActions>
    </form>
  );
}

function ShowButton() {
  const [isOpen, setIsOpen] = useState(false);

  const key = useRef(0);

  const closeAndReset = useCallback(() => {
    setIsOpen(false);
    key.current += 1;
  }, []);

  return (
    <>
      <Button type="button" plain onClick={() => setIsOpen(true)}>
        <EyeIcon /> Bekijk gegevens
      </Button>
      <Dialog open={isOpen} onClose={closeAndReset}>
        <DialogTitle>Bekijk gegevens</DialogTitle>
        <DialogDescription>
          Vul de datum van uitgifte en het diplomanummer in om de
          persoonsgegevens voor dit diploma te bekijken.
        </DialogDescription>
        <Form key={String(key)} closeAndReset={closeAndReset} />
      </Dialog>
    </>
  );
}

function HideButton() {
  const pathname = usePathname();

  return (
    <Button type="button" plain href={pathname} prefetch={false} scroll={false}>
      <EyeSlashIcon /> Verberg gegevens
    </Button>
  );
}

export function TogglePiiButton({
  currentState,
}: {
  currentState: "show" | "hide";
}) {
  if (currentState === "hide") {
    return <ShowButton />;
  }

  return <HideButton />;
}
