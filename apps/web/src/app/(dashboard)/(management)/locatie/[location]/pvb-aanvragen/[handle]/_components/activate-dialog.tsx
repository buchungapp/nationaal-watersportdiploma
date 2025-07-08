"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { submitPvbAanvraagAction } from "~/app/_actions/pvb/single-operations-action";

export function ActivateDialog({
  open,
  onClose,
  params,
}: {
  open: boolean;
  onClose: () => void;
  params: Promise<{ location: string; handle: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleActivate = async () => {
    startTransition(async () => {
      try {
        const resolvedParams = await params;
        await submitPvbAanvraagAction({
          locationHandle: resolvedParams.location,
          handle: resolvedParams.handle,
        });

        router.refresh();
        onClose();
      } catch (error) {
        console.error("Failed to activate aanvraag:", error);
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Aanvraag indienen</DialogTitle>
      <DialogBody>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Weet u zeker dat u deze PvB aanvraag wilt indienen? De aanvraag
            wordt zichtbaar voor het Secretariaat en de leercoach kan
            toestemming geven.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Na indienen zal de status wijzigen naar "Wacht op voorwaarden" en
            kunnen de benodigde stappen worden uitgevoerd om de beoordeling te
            starten.
          </p>
        </div>
      </DialogBody>
      <DialogActions>
        <Button type="button" plain onClick={onClose} disabled={isPending}>
          Annuleren
        </Button>
        <Button
          type="button"
          color="branding-orange"
          onClick={handleActivate}
          disabled={isPending}
        >
          {isPending ? "Bezig..." : "Indienen"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
