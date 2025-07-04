"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import { withdrawPvbAanvraagAction } from "../actions";

export function WithdrawDialog({
  open,
  onClose,
  params,
}: {
  open: boolean;
  onClose: () => void;
  params: Promise<{ location: string; handle: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const router = useRouter();

  const handleWithdraw = async () => {
    startTransition(async () => {
      try {
        const resolvedParams = await params;
        await withdrawPvbAanvraagAction(
          resolvedParams.handle,
          reason || undefined,
        );

        router.refresh();
        onClose();
        setReason(""); // Reset the form
      } catch (error) {
        console.error("Failed to withdraw aanvraag:", error);
      }
    });
  };

  const handleClose = () => {
    onClose();
    setReason(""); // Reset the form when closing
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Aanvraag intrekken</DialogTitle>
      <DialogBody>
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Weet u zeker dat u deze PvB aanvraag wilt intrekken? Deze actie
              kan niet ongedaan gemaakt worden.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Na het intrekken van de aanvraag zal deze niet meer beoordeeld
              kunnen worden en zal de status wijzigen naar "Ingetrokken".
            </p>
          </div>
          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Reden voor intrekken (optioneel)
            </label>
            <Textarea
              id="reason"
              name="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Geef een reden op voor het intrekken van deze aanvraag..."
              className="w-full"
            />
          </div>
        </div>
      </DialogBody>
      <DialogActions>
        <Button type="button" plain onClick={handleClose} disabled={isPending}>
          Annuleren
        </Button>
        <Button
          type="button"
          color="red"
          onClick={handleWithdraw}
          disabled={isPending}
        >
          {isPending ? "Bezig..." : "Intrekken"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
