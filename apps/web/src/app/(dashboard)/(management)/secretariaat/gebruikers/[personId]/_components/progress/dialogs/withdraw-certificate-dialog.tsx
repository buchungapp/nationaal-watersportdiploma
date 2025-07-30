"use client";

import { useAction } from "next-safe-action/hooks";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import type { Certificate } from "~/app/(dashboard)/(account)/profiel/[handle]/_components/progress/certificates";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { withdrawCertificatesAction } from "~/app/_actions/certificate/withdraw-certificates-action";
import Spinner from "~/app/_components/spinner";

export function WithdrawCertificateDialog({
  certificateId,
  open,
  onClose,
}: {
  certificateId: Certificate["id"];
  open: boolean;
  onClose: () => void;
}) {
  const { execute } = useAction(
    withdrawCertificatesAction.bind(null, [certificateId]),
    {
      onSuccess: () => {
        onClose();
        toast.success("Diploma verwijderd.");
      },
    },
  );

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Weet je zeker dat dit diploma wilt verwijderen?</DialogTitle>
      <form action={execute}>
        <DialogBody>Dit kan niet ongedaan worden gemaakt.</DialogBody>
        <DialogActions>
          <Button plain onClick={onClose}>
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
