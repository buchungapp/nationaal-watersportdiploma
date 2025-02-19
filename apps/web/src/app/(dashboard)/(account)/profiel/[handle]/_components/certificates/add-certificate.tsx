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
import Media from "./media";
import { type CertificateTypes, Type } from "./type";
import {
  CWOType,
  MarifoonType,
  OtherType,
  TKNType,
  VaarbewijsType,
} from "./types";

export function AddCertificate({
  personId,
}: {
  personId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<"media" | "type" | "metadata">(
    "media",
  );
  const [type, setType] = useState<CertificateTypes | null>(null);
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
            setType(null);
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
                  <Type type={type} setType={setType} />
                </div>

                <div className={currentStep === "media" ? "hidden" : ""}>
                  {type === "cwo" ? (
                    <CWOType />
                  ) : type === "vaarbewijs" ? (
                    <VaarbewijsType />
                  ) : type === "marifoon" ? (
                    <MarifoonType />
                  ) : type === "tkn" ? (
                    <TKNType />
                  ) : type === "other" ? (
                    <OtherType />
                  ) : null}
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
                  setType(null);
                }, 100);
              }}
            >
              Sluiten
            </Button>

            {currentStep === "media" ? (
              validMedia ? (
                <Button onClick={() => setCurrentStep("type")}>Volgende</Button>
              ) : (
                <Button plain onClick={() => setCurrentStep("type")}>
                  Doorgaan zonder foto
                </Button>
              )
            ) : (
              <SubmitButton />
            )}
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Opslaan
    </Button>
  );
}
