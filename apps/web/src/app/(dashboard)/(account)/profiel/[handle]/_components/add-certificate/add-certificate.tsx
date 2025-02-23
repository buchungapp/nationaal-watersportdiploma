"use client";
import { InformationCircleIcon, PlusIcon } from "@heroicons/react/16/solid";
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
import { FieldGroup, Fieldset } from "~/app/(dashboard)/_components/fieldset";
import { Notification } from "~/app/(dashboard)/_components/notification";
import { Text } from "~/app/(dashboard)/_components/text";
import { TekstButton } from "~/app/(public)/_components/style/buttons";
import Spinner from "~/app/_components/spinner";
import { addExternalCertificate } from "../../_actions/certificate";
import { CertificateTemplatePicker } from "./certificate-template-picker";
import type { CertificateTemplate } from "./certificate-templates";
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

  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await addExternalCertificate(
      { personId },
      prevState,
      formData,
    );

    if (result.message === "Success") {
      close();
      toast.success("Certificaat toegevoegd.");
    }

    return result;
  };

  const [state, action] = useActionState(submit, undefined);

  return (
    <>
      <Button outline onClick={() => setIsOpen(true)} className={className}>
        <PlusIcon className="size-8" />
        <span className="hidden sm:inline">Voeg diploma toe</span>
      </Button>

      <Dialog open={isOpen} onClose={close}>
        <DialogTitle>
          Voeg een nieuw diploma, bewijs of certificaat toe
        </DialogTitle>
        <Text>
          Hier kan je je diploma uploaden super leuk dat betekent dit en klik op
          dit helpartikel voor meer info
          {/* TODO: change */}
        </Text>
        {currentStep === "media" ? (
          <Notification color="blue" className="justify-between mt-3">
            <div className="flex gap-1 items-center">
              <InformationCircleIcon className="size-4 shrink-0" />
              Disclaimer! Bla bla bla
              {/* TODO: change */}
            </div>
            <div className="flex gap-1 items-center font-semibold">
              <TekstButton href={"#TODO"} target="_blank">
                Details
              </TekstButton>
            </div>
          </Notification>
        ) : null}
        <form action={action}>
          <DialogBody>
            <Fieldset>
              <FieldGroup>
                <Media
                  setValidMedia={setValidMedia}
                  errors={state?.errors}
                  small={!validMedia && currentStep !== "media"}
                />
                <div className={currentStep === "media" ? "hidden" : ""}>
                  <CertificateTemplatePicker
                    selectedCertificateTemplate={selectedCertificateTemplate}
                    setSelectedCertificateTemplate={
                      setSelectedCertificateTemplate
                    }
                  />
                </div>

                <div
                  className={
                    selectedCertificateTemplate === null ? "hidden" : ""
                  }
                >
                  <Metadata
                    errors={state?.errors}
                    selectedCertificateTemplate={selectedCertificateTemplate}
                  />
                </div>
              </FieldGroup>
            </Fieldset>
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
