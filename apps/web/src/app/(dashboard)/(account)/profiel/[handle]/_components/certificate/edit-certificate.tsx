"use client";
import Image from "next/image";
import { parseAsString, useQueryState } from "nuqs";
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
import Spinner from "~/app/_components/spinner";
import { updateExternalCertificateAction } from "../../_actions/certificate";
import type { ExternalCertificate } from "../certificates";
import MediaViewer from "../media-viewer";
import { PDFViewer, PDFViewerText } from "../pdf-viewer";
import { Metadata } from "./metadata";

export function EditCertificateButton({
  certificate,
}: {
  certificate: ExternalCertificate;
}) {
  const [_, setIsOpen] = useQueryState(
    "edit-certificate",
    parseAsString.withOptions({
      shallow: false,
    }),
  );

  return (
    <DropdownItem onClick={() => setIsOpen(certificate.id)}>
      <DropdownLabel>Diploma bewerken</DropdownLabel>
    </DropdownItem>
  );
}

export function EditCertificate({
  personId,
  certificates,
}: {
  personId: string;
  certificates: ExternalCertificate[];
}) {
  const [isOpen, setIsOpen] = useQueryState(
    "edit-certificate",
    parseAsString.withOptions({
      shallow: false,
    }),
  );

  const close = () => {
    setIsOpen(null);
  };

  const certificate = certificates.find(
    (certificate) => certificate.id === isOpen,
  );

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

  if (!certificate) {
    return null;
  }

  const { metadata, media, location, ...defaultValues } = certificate;

  return (
    <Dialog onClose={close}>
      <DialogTitle>Bewerk je certificaat</DialogTitle>
      <form action={action}>
        <DialogBody>
          <Fieldset>
            <FieldGroup>
              {media ? (
                <MediaViewer media={media} className="w-full">
                  <div className="flex justify-center bg-slate-100 p-1 rounded-md w-full">
                    {media.type === "image" ? (
                      <Image
                        src={media.url}
                        alt={media.alt ?? media.name}
                        width={media.width ?? 100}
                        height={media.height ?? 100}
                        className="rounded w-auto h-auto max-h-45 object-contain"
                      />
                    ) : (
                      <div className="w-full h-45">
                        <PDFViewer file={media.url}>
                          <PDFViewerText>
                            Klik om meer pagina's te bekijken
                          </PDFViewerText>
                        </PDFViewer>
                      </div>
                    )}
                  </div>
                </MediaViewer>
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
