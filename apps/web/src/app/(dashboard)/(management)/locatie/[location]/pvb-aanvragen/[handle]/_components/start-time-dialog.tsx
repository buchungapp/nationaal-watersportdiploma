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
import { Input } from "~/app/(dashboard)/_components/input";
import { updatePvbStartTimeAction } from "../actions";

export function StartTimeDialog({
  open,
  onClose,
  params,
}: {
  open: boolean;
  onClose: () => void;
  params: Promise<{ location: string; handle: string }>;
}) {
  const [startDatumTijd, setStartDatumTijd] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const resolvedParams = await params;
        await updatePvbStartTimeAction(resolvedParams.handle, startDatumTijd);

        router.refresh();
        onClose();
        setStartDatumTijd("");
      } catch (error) {
        console.error("Failed to update start time:", error);
      }
    });
  };

  const handleClose = () => {
    onClose();
    setStartDatumTijd("");
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Starttijd wijzigen</DialogTitle>
        <DialogBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Stel een nieuwe aanvangsdatum en -tijd in voor alle onderdelen van
              deze PvB aanvraag.
            </p>
            <div>
              <label
                htmlFor="starttime"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Aanvangsdatum en -tijd
              </label>
              <Input
                id="starttime"
                type="datetime-local"
                value={startDatumTijd}
                onChange={(e) => setStartDatumTijd(e.target.value)}
                required
                className="w-full"
              />
            </div>
          </div>
        </DialogBody>
        <DialogActions>
          <Button
            type="button"
            plain
            onClick={handleClose}
            disabled={isPending}
          >
            Annuleren
          </Button>
          <Button
            type="submit"
            color="branding-orange"
            disabled={isPending || !startDatumTijd}
          >
            {isPending ? "Bezig..." : "Wijzigen"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
