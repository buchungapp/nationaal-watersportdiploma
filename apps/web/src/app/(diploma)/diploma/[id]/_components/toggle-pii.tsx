"use client";

import { EyeIcon, EyeSlashIcon } from "@heroicons/react/16/solid";
import { useParams, usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
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
import { showPiiHandler } from "../_actions";

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

  const formActionWithId = showPiiHandler.bind(null, certificateId);

  const [result, action] = useFormState(formActionWithId, undefined);

  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action}>
      <DialogBody>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
            <Field>
              <Label>Datum van uitgifte</Label>
              <Input name="issuedDate" type="date" required />
            </Field>
            <Field>
              <Label>Diplomanummer</Label>
              <Input name="handle" minLength={10} type="text" required />
            </Field>
          </div>
        </FieldGroup>
      </DialogBody>

      {result?.success === false ? (
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
  }, [setIsOpen]);

  return (
    <>
      <Button
        type="button"
        plain
        onClick={() => setIsOpen(true)}
        className="-mr-[5px] -mt-[5px]"
      >
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
    <>
      <Button
        type="button"
        plain
        href={pathname}
        prefetch={false}
        scroll={false}
        className="-mr-[5px] -mt-[5px]"
      >
        <EyeSlashIcon /> Verberg gegevens
      </Button>
    </>
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
