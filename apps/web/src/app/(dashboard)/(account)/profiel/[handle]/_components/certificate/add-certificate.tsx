"use client";
import { PlusIcon } from "@heroicons/react/16/solid";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createExternalCertificateAction } from "~/actions/certificate/create-external-certificate-action";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { FieldGroup } from "~/app/(dashboard)/_components/fieldset";
import { Notification } from "~/app/(dashboard)/_components/notification";
import { Text } from "~/app/(dashboard)/_components/text";
import Spinner from "~/app/_components/spinner";
import { CertificateTemplatePicker } from "./certificate-template-picker";
import {
  type CertificateTemplate,
  certificateTemplates,
} from "./certificate-templates";
import Media from "./media";
import { Metadata } from "./metadata";

export function AddCertificate({
  personId,
  className,
}: {
  personId: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<"media" | "metadata">("media");
  const [selectedCertificateTemplate, setSelectedCertificateTemplate] =
    useState<CertificateTemplate["id"] | null>(null);
  const [validMedia, setValidMedia] = useState(false);

  const close = () => {
    setIsOpen(false);
    setTimeout(() => {
      setValidMedia(false);
      setSelectedCertificateTemplate(null);
      setCurrentStep("media");
    }, 100);
  };

  const { execute, result } = useAction(
    createExternalCertificateAction.bind(null, personId),
    {
      onSuccess: () => {
        close();
        toast.success("Certificaat toegevoegd.");
      },
    },
  );

  const template = certificateTemplates.find(
    (template) => template.id === selectedCertificateTemplate,
  );

  return (
    <>
      <Button outline onClick={() => setIsOpen(true)} className={className}>
        <PlusIcon className="size-8" />
        <span className="hidden sm:inline">Voeg diploma toe</span>
      </Button>

      <Dialog open={isOpen} onClose={close}>
        <DialogTitle>Voeg een nieuw diploma toe</DialogTitle>
        <Text>
          Upload een kopie van je diploma en vul de details in. Alleen de titel
          is verplicht.
        </Text>
        <form action={execute}>
          <DialogBody>
            <FieldGroup>
              <Media
                stepIndex={1}
                setValidMedia={setValidMedia}
                invalid={!!result?.validationErrors?.media}
                small={!validMedia && currentStep !== "media"}
              />
              <div className={currentStep === "media" ? "hidden" : ""}>
                <CertificateTemplatePicker
                  stepIndex={2}
                  selectedCertificateTemplate={selectedCertificateTemplate}
                  setSelectedCertificateTemplate={
                    setSelectedCertificateTemplate
                  }
                />
              </div>

              <div
                className={selectedCertificateTemplate === null ? "hidden" : ""}
              >
                <Metadata
                  stepIndex={3}
                  invalid={{
                    title: !!result?.validationErrors?.title,
                    issuingAuthority:
                      !!result?.validationErrors?.issuingAuthority,
                    identifier: !!result?.validationErrors?.identifier,
                    issuingLocation:
                      !!result?.validationErrors?.issuingLocation,
                    awardedAt: !!result?.validationErrors?.awardedAt,
                    additionalComments:
                      !!result?.validationErrors?.additionalComments,
                  }}
                  defaultValues={{
                    title: template?.title,
                    issuingAuthority: template?.issuingAuthority,
                  }}
                />
              </div>
            </FieldGroup>
            {currentStep === "metadata" &&
            selectedCertificateTemplate !== null ? (
              <>
                <Notification color="zinc" className="justify-between mt-3">
                  <InformationCircleIcon /> Je gegevens worden veilig opgeslagen
                  en zijn alleen zichtbaar voor jou. Je kunt later kiezen om
                  specifieke diploma's te delen met anderen.
                  <br />
                  <br /> Let op: Dit overzicht is alleen bedoeld voor je
                  persoonlijke administratie. Deze digitale registraties worden
                  niet geaccepteerd als geldig bewijs door officiële instanties
                  - je moet altijd je originele diploma's of officieel
                  gewaarmerkte kopieën kunnen tonen.
                </Notification>
              </>
            ) : null}
          </DialogBody>
          <DialogActions>
            <Button plain onClick={close}>
              Sluiten
            </Button>

            {currentStep === "media" ? (
              validMedia ? (
                <Button onClick={() => setCurrentStep("metadata")}>
                  Volgende
                </Button>
              ) : (
                <Button plain onClick={() => setCurrentStep("metadata")}>
                  Doorgaan zonder foto
                </Button>
              )
            ) : (
              <SubmitButton invalid={!selectedCertificateTemplate} />
            )}
          </DialogActions>
        </form>
      </Dialog>
    </>
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
