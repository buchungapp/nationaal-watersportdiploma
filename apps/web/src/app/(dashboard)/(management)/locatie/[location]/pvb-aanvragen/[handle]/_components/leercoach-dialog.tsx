"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { updatePvbLeercoachAction } from "../actions";

export function LeercoachDialog({
  open,
  onClose,
  params,
}: {
  open: boolean;
  onClose: () => void;
  params: Promise<{ location: string; handle: string }>;
}) {
  const [leercoachId, setLeercoachId] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const resolvedParams = await params;
        await updatePvbLeercoachAction(resolvedParams.handle, leercoachId);

        router.refresh();
        onClose();
      } catch (error) {
        console.error("Failed to update leercoach:", error);
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Leercoach toewijzen</DialogTitle>
        <DialogDescription>
          Selecteer een leercoach voor deze PvB aanvraag. De leercoach zal een
          verzoek ontvangen om toestemming te geven.
        </DialogDescription>
        <DialogBody>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="leercoach"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Leercoach
              </label>
              <select
                id="leercoach"
                name="leercoach"
                value={leercoachId}
                onChange={(e) => setLeercoachId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600"
                required
              >
                <option value="">Selecteer een leercoach</option>
                {/* In a real implementation, this would be populated with actual instructors */}
                <option value="instructor-1">Instructeur 1</option>
                <option value="instructor-2">Instructeur 2</option>
              </select>
            </div>
          </div>
        </DialogBody>
        <DialogActions>
          <Button type="button" plain onClick={onClose} disabled={isPending}>
            Annuleren
          </Button>
          <Button
            type="submit"
            color="branding-orange"
            disabled={isPending || !leercoachId}
          >
            {isPending ? "Bezig..." : "Toewijzen"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
