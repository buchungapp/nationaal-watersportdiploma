"use client";
import { InformationCircleIcon } from "@heroicons/react/16/solid";
import { PlusIcon } from "@heroicons/react/20/solid";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
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
import { CertificateTemplatePicker } from "./certificate-template-picker";
import type { CertificateTemplate } from "./certificate-templates";
import Media from "./media";
import { Metadata } from "./metadata";

export function AddCertificate({
  personId,
}: {
  personId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<"media" | "metadata">("media");
  const [selectedCertificateTemplate, setSelectedCertificateTemplate] =
    useState<CertificateTemplate["id"] | null>(null);
  const [validMedia, setValidMedia] = useState(false);

  const submit = async (prevState: unknown, formData: FormData) => {
    console.log(prevState, formData.entries().toArray());

    return null;
  };

  const [state, action] = useActionState(submit, undefined);

  return (
    <>
      <button
        type="button"
        className="overflow-hidden w-full h-full rounded-xl border border-dashed border-slate-200 flex items-center justify-center flex-col text-zinc-500 cursor-pointer p-4"
        onClick={() => setIsOpen(true)}
      >
        <PlusIcon className="size-8" />
        Voeg een nieuw diploma, bewijs of certificaat toe
      </button>

      <Dialog
        open={isOpen}
        onClose={(value) => {
          setIsOpen(value);

          setTimeout(() => {
            setValidMedia(false);
            setSelectedCertificateTemplate(null);
            setCurrentStep("media");
          }, 100);
        }}
      >
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
                    selectedCertificateTemplate={selectedCertificateTemplate}
                  />
                </div>
              </FieldGroup>
            </Fieldset>
          </DialogBody>
          <DialogActions>
            <Button
              plain
              onClick={() => {
                setIsOpen(false);
                setTimeout(() => {
                  setCurrentStep("media");
                  setValidMedia(false);
                  setSelectedCertificateTemplate(null);
                }, 100);
              }}
            >
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
