"use client";
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
import Spinner from "~/app/_components/spinner";
import { addMediaToExternalCertificateAction } from "../../_actions/certificate";
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

  const close = () => {
    setIsOpen(false);
    setTimeout(() => {
      setValidMedia(false);
    }, 100);
  };

  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await addMediaToExternalCertificateAction(
      { personId, externalCertificateId },
      prevState,
      formData,
    );

    if (result.message === "Success") {
      close();
      toast.success("Media toegevoegd.");
    }

    return result;
  };

  const [state, action] = useActionState(submit, undefined);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          "w-full h-full border border-dashed rounded-md flex flex-col items-center justify-center hover:bg-slate-100"
        }
      >
        <div className="text-center flex items-center justify-center flex-col text-xs text-[#878787] p-2 py-6">
          Klik om een afbeelding te uploaden.
        </div>
      </button>

      <Dialog open={isOpen} onClose={close}>
        <DialogTitle>Voeg een afbeelding aan je certificaat toe</DialogTitle>
        <form action={action}>
          <DialogBody>
            <Fieldset>
              <FieldGroup>
                <Media setValidMedia={setValidMedia} errors={state?.errors} />
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
