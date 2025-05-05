"use client";
import Image from "next/image";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { useFormStatus } from "react-dom";
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
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { updateExternalCertificateAction } from "~/actions/certificate/update-external-certificate-action";
import { useFormInput } from "~/actions/hooks/useFormInput";
import {
  PDFViewer,
  PDFViewerText,
} from "~/app/(dashboard)/_components/pdf-viewer";
import Spinner from "~/app/_components/spinner";
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
      reset();
    }, 100);
  };

  const { execute, result, input, reset } = useAction(
    updateExternalCertificateAction.bind(null, personId, certificate.id),
    {
      onSuccess: () => {
        close();
        toast.success("Diploma bijgewerkt.");
      },
    },
  );

  const { metadata, media, ...defaultValues } = certificate;

  const { getInputValue } = useFormInput(input, {
    issuingLocation: defaultValues.location,
    ...defaultValues,
  });

  return (
    <Dialog onClose={close} open={isOpen === certificate.id}>
      <DialogTitle>Bewerk je certificaat</DialogTitle>
      <form action={execute}>
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
                invalid={!!result?.validationErrors?.media}
                small={validMedia}
                key={getInputValue("media")?.lastModified} // File input do not allow defaultValue so reset field by changing key
              />
            )}

            <Metadata
              stepIndex={media ? 1 : 2}
              invalid={{
                issuingLocation: !!result?.validationErrors?.issuingLocation,
                title: !!result?.validationErrors?.title,
                identifier: !!result?.validationErrors?.identifier,
                awardedAt: !!result?.validationErrors?.awardedAt,
                issuingAuthority: !!result?.validationErrors?.issuingAuthority,
                additionalComments:
                  !!result?.validationErrors?.additionalComments,
              }}
              defaultValues={{
                issuingLocation: getInputValue("issuingLocation"),
                title: getInputValue("title"),
                identifier: getInputValue("identifier"),
                awardedAt: getInputValue("awardedAt"),
                issuingAuthority: getInputValue("issuingAuthority"),
                additionalComments: getInputValue("additionalComments"),
              }}
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
