"use client";
import { useAction } from "next-safe-action/hooks";
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
import { useDialog } from "~/app/(dashboard)/_hooks/use-dialog";
import { removeExternalCertificateAction } from "~/app/_actions/certificate/remove-external-certificate-action";
import Spinner from "~/app/_components/spinner";
import type { ExternalCertificate } from "./certificates-list";

export function RemoveCertificateButton() {
  const { open } = useDialog("remove-certificate");

  return (
    <DropdownItem onClick={open}>
      <DropdownLabel>Diploma verwijderen</DropdownLabel>
    </DropdownItem>
  );
}

export function RemoveCertificate({
  personId,
  certificateId,
}: {
  personId: string;
  certificateId: ExternalCertificate["id"];
}) {
  const { isOpen, close } = useDialog("remove-certificate");

  const { execute } = useAction(
    removeExternalCertificateAction.bind(null, personId, certificateId),
    {
      onSuccess: () => {
        close();
        toast.success("Diploma verwijderd.");
      },
    },
  );

  return (
    <Dialog open={isOpen} onClose={close}>
      <DialogTitle>
        Weet je zeker dat dit certificaat wilt verwijderen?
      </DialogTitle>
      <form action={execute}>
        <DialogBody>Dit kan niet ongedaan worden gemaakt.</DialogBody>
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
    <Button color="red" disabled={pending || invalid} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Verwijderen
    </Button>
  );
}
