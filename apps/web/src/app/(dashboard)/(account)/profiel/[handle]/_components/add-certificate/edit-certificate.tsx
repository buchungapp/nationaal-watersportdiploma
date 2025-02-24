"use client";
import {
  type PropsWithChildren,
  createContext,
  useActionState,
  useContext,
  useState,
} from "react";
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
import type { listExternalCertificatesForPerson } from "~/lib/nwd";
import { updateExternalCertificateAction } from "../../_actions/certificate";
import Media from "./media";
import { Metadata } from "./metadata";

type ExternalCertificate = Awaited<
  ReturnType<typeof listExternalCertificatesForPerson>
>[number];

interface EditCertificateContextValue {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const EditCertificateContext = createContext<EditCertificateContextValue>(
  {} as EditCertificateContextValue,
);

export function EditCertificateProvider({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <EditCertificateContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </EditCertificateContext.Provider>
  );
}

function useEditCertificateDialog() {
  const context = useContext(EditCertificateContext);
  if (context === undefined) {
    throw new Error(
      "useEditCertificateDialog must be used within a EditCertificateProvider",
    );
  }

  return context;
}

export function EditCertificateButton() {
  const { setIsOpen } = useEditCertificateDialog();

  return (
    <DropdownItem onClick={() => setIsOpen(true)}>
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
  const { isOpen, setIsOpen } = useEditCertificateDialog();

  const close = () => {
    setIsOpen(false);
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
    <Dialog open={isOpen} onClose={close}>
      <DialogTitle>Bewerk je certificaat</DialogTitle>
      <form action={action}>
        <DialogBody>
          <Fieldset>
            <FieldGroup>
              <Media stepIndex={1} small errors={state?.errors} allowRemove />
              <Metadata
                stepIndex={2}
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
