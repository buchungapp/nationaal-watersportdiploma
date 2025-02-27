"use client";
import Image from "next/image";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import {
  DropdownItem,
  DropdownLabel,
} from "~/app/(dashboard)/_components/dropdown";
import { FieldGroup, Fieldset } from "~/app/(dashboard)/_components/fieldset";
import { useDialog } from "~/app/(dashboard)/_hooks/use-dialog";
import Spinner from "~/app/_components/spinner";
import { updateExternalCertificateAction } from "../../_actions/certificate";
import type { ExternalCertificate } from "../certificates";
import { Metadata } from "./metadata";

export function EditCertificateButton() {
  const { open } = useDialog("edit-certificate");
  return (
    <DropdownItem onClick={open}>
      <DropdownLabel>Diploma bewerken</DropdownLabel>
    </DropdownItem>
  );
}

export function EditCertificate({
  personId,
  certificate,
}: {
  personId: string;
  certificate: ExternalCertificate;
}) {
  const { isOpen, close } = useDialog("edit-certificate");

  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await updateExternalCertificateAction(
      { personId, externalCertificateId: certificate.id },
      prevState,
      formData,
    );

    if (result.message === "Success") {
      close();
      toast.success("Diploma bijgewerkt.");
    }

    return result;
  };

  const [state, action] = useActionState(submit, undefined);

  const { metadata, media, location, ...defaultValues } = certificate;

  return (
    <Dialog open={isOpen} onClose={close}>
      <DialogTitle>Bewerk je certificaat</DialogTitle>
      <form action={action}>
        <DialogBody>
          <Fieldset>
            <FieldGroup>
              {media ? (
                <div className="p-1 w-full flex justify-center rounded-md bg-slate-100">
                  <Image
                    src={media.url}
                    alt={media.alt ?? media.name}
                    width={media.width ?? 100}
                    height={media.height ?? 100}
                    className="rounded w-auto h-auto max-h-45 object-contain"
                  />
                </div>
              ) : null}

              <Metadata
                stepIndex={1}
                errors={state?.errors}
                defaultValues={{ issuingLocation: location, ...defaultValues }}
              />
            </FieldGroup>
          </Fieldset>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={close}>
            Sluiten
          </Button>

          <SubmitButton />
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
