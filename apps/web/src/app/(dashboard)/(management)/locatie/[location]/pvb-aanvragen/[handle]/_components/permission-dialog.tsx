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
import { grantPvbLeercoachPermissionAction } from "~/app/_actions/pvb/single-operations-action";

export function PermissionDialog({
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

  const handleGrantPermission = async () => {
    startTransition(async () => {
      try {
        const resolvedParams = await params;
        await grantPvbLeercoachPermissionAction({
          locationHandle: resolvedParams.location,
          handle: resolvedParams.handle,
          reason: reason || undefined,
        });

        router.refresh();
        onClose();
        setReason(""); // Reset the form
      } catch (error) {
        console.error("Failed to grant leercoach permission:", error);
      }
    });
  };

  const handleClose = () => {
    onClose();
    setReason(""); // Reset the form when closing
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Toestemming namens leercoach</DialogTitle>
      <DialogBody>
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              U staat op het punt om toestemming te geven namens de leercoach
              voor deze PvB aanvraag.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Deze actie geeft toestemming voor de beoordeling namens de
              toegewezen leercoach.
            </p>
          </div>
          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Reden (optioneel)
            </label>
            <Textarea
              id="reason"
              name="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Geef een reden op voor het verlenen van toestemming namens de leercoach..."
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
          color="branding-orange"
          onClick={handleGrantPermission}
          disabled={isPending}
        >
          {isPending ? "Bezig..." : "Toestemming geven"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
