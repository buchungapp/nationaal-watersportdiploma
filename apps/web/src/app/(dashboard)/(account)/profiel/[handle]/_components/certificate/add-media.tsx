"use client";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
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
import { addMediaToExternalCertificateAction } from "~/app/_actions/certificate/add-media-to-external-certificate-action";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import Spinner from "~/app/_components/spinner";
import Media from "./media";

export function AddMedia({
  personId,
  externalCertificateId,
}: {
  personId: string;
  externalCertificateId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [validMedia, setValidMedia] = useState(false);

  const { execute, result, input, reset } = useAction(
    addMediaToExternalCertificateAction.bind(
      null,
      personId,
      externalCertificateId,
    ),
    {
      onSuccess: () => {
        close();
        toast.success("Media toegevoegd.");
      },
    },
  );

  const close = () => {
    setIsOpen(false);
    setTimeout(() => {
      setValidMedia(false);
      reset();
    }, 100);
  };

  const { getInputValue } = useFormInput(input);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          "w-full h-full border border-dashed rounded-md flex flex-col items-center justify-center hover:bg-slate-100"
        }
      >
        <div className="flex flex-col justify-center items-center p-2 py-6 text-[#878787] text-xs text-center">
          Klik om een afbeelding te uploaden.
        </div>
      </button>

      <Dialog open={isOpen} onClose={close}>
        <DialogTitle>Voeg een afbeelding aan je certificaat toe</DialogTitle>
        <form action={execute}>
          <DialogBody>
            <Fieldset>
              <FieldGroup>
                <Media
                  stepIndex={1}
                  setValidMedia={setValidMedia}
                  invalid={!!result?.validationErrors?.media}
                  key={getInputValue("media")?.lastModified} // File input do not allow defaultValue so reset field by changing key
                />
              </FieldGroup>
            </Fieldset>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={close}>
              Sluiten
            </Button>

            <SubmitButton invalid={!validMedia} />
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
