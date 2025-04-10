"use client";
import Image from "next/image";
import { parseAsString, useQueryState } from "nuqs";
import { useActionState, useState } from "react";
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
import { FieldGroup } from "~/app/(dashboard)/_components/fieldset";
import "~/app/(dashboard)/_components/pdf-viewer";
import {
  PDFViewer,
  PDFViewerText,
} from "~/app/(dashboard)/_components/pdf-viewer";
import Spinner from "~/app/_components/spinner";
import { updateExternalCertificateAction } from "../../_actions/certificate";
import type { ExternalCertificate } from "../certificates";
import { MediaViewerButton } from "../media-viewer";
import Media from "./media";
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
  certificate,
}: {
  personId: string;
  certificate: ExternalCertificate;
}) {
  const [isOpen, setIsOpen] = useQueryState("edit-certificate", parseAsString);
  const [validMedia, setValidMedia] = useState(false);

  const close = () => {
    setIsOpen(null);
    setTimeout(() => {
      setValidMedia(false);
    }, 100);
  };

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
    <Dialog onClose={close} open={isOpen === certificate.id}>
      <DialogTitle>Bewerk je certificaat</DialogTitle>
      <form action={action}>
        <DialogBody>
          <FieldGroup>
            {media ? (
              <MediaViewerButton media={media} className="w-full">
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
              </MediaViewerButton>
            ) : (
              <Media
                stepIndex={1}
                setValidMedia={setValidMedia}
                errors={state?.errors}
                small={validMedia}
              />
            )}

            <Metadata
              stepIndex={media ? 1 : 2}
              errors={state?.errors}
              defaultValues={{ issuingLocation: location, ...defaultValues }}
            />
          </FieldGroup>
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
