"use client";

import {
  CheckCircleIcon,
  ChevronDownIcon,
  PlayIcon,
  XCircleIcon,
} from "@heroicons/react/16/solid";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import { Field, Label } from "~/app/(dashboard)/_components/fieldset";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import {
  abortPvbAction,
  finalizePvbAssessmentAction,
  startPvbAssessmentAction,
} from "~/app/_actions/pvb/assessment-action";
import type { retrievePvbAanvraagByHandle } from "~/lib/nwd";

interface BeoordelaarViewProps {
  aanvraag: Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>;
  personId: string;
}

export function BeoordelaarView({ aanvraag, personId }: BeoordelaarViewProps) {
  const [openDialog, setOpenDialog] = useState<
    "start" | "abort" | "finalize" | null
  >(null);
  const [abortReason, setAbortReason] = useState("");

  // Action hooks
  const startAction = useAction(startPvbAssessmentAction);
  const abortAction = useAction(abortPvbAction);
  const finalizeAction = useAction(finalizePvbAssessmentAction);

  // Check if user is beoordelaar for any onderdeel
  const isBeoordelaar = aanvraag.onderdelen.some(
    (onderdeel) => onderdeel.beoordelaar?.id === personId,
  );

  if (!isBeoordelaar) {
    return null;
  }

  const canStart = aanvraag.status === "gereed_voor_beoordeling";
  const canAbort = aanvraag.status === "in_beoordeling";
  const canFinalize =
    aanvraag.status === "in_beoordeling" &&
    aanvraag.onderdelen.every(
      (onderdeel) =>
        onderdeel.beoordelaar?.id !== personId ||
        onderdeel.uitslag !== "nog_niet_bekend",
    );

  const handleStart = () => {
    startAction.execute({
      handle: aanvraag.handle,
      pvbAanvraagId: aanvraag.id,
    });
  };

  const handleAbort = () => {
    if (!abortReason.trim()) {
      toast.error("Vul een reden in");
      return;
    }

    abortAction.execute({
      handle: aanvraag.handle,
      pvbAanvraagId: aanvraag.id,
      reason: abortReason,
    });
  };

  const handleFinalize = () => {
    finalizeAction.execute({
      handle: aanvraag.handle,
      pvbAanvraagId: aanvraag.id,
    });
  };

  // Handle action results
  if (startAction.result.data) {
    toast.success(startAction.result.data.message);
    setOpenDialog(null);
    startAction.reset();
  } else if (startAction.result.serverError) {
    toast.error(startAction.result.serverError);
  }

  if (abortAction.result.data) {
    toast.success(abortAction.result.data.message);
    setOpenDialog(null);
    setAbortReason("");
    abortAction.reset();
  } else if (abortAction.result.serverError) {
    toast.error(abortAction.result.serverError);
  }

  if (finalizeAction.result.data) {
    toast.success(finalizeAction.result.data.message);
    setOpenDialog(null);
    finalizeAction.reset();
  } else if (finalizeAction.result.serverError) {
    toast.error(finalizeAction.result.serverError);
  }

  const isSubmitting =
    startAction.status === "executing" ||
    abortAction.status === "executing" ||
    finalizeAction.status === "executing";

  return (
    <>
      <Dropdown>
        <DropdownButton color="dark/white">
          Acties
          <ChevronDownIcon />
        </DropdownButton>
        <DropdownMenu>
          {canStart && (
            <DropdownItem onClick={() => setOpenDialog("start")}>
              <PlayIcon data-slot="icon" />
              Beoordeling starten
            </DropdownItem>
          )}
          {canAbort && (
            <DropdownItem onClick={() => setOpenDialog("abort")}>
              <XCircleIcon data-slot="icon" />
              Beoordeling afbreken
            </DropdownItem>
          )}
          {canFinalize && (
            <DropdownItem onClick={() => setOpenDialog("finalize")}>
              <CheckCircleIcon data-slot="icon" />
              Beoordeling afronden
            </DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>

      {/* Start Dialog */}
      <Dialog open={openDialog === "start"} onClose={() => setOpenDialog(null)}>
        <DialogTitle>Beoordeling starten</DialogTitle>
        <DialogDescription>
          Weet je zeker dat je de beoordeling wilt starten? De aanvraag kan
          vanaf dan niet meer gewijzigd worden.
        </DialogDescription>
        <DialogActions>
          <Button plain onClick={() => setOpenDialog(null)}>
            Annuleren
          </Button>
          <Button color="green" onClick={handleStart} disabled={isSubmitting}>
            {startAction.status === "executing" ? "Bezig..." : "Starten"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Abort Dialog */}
      <Dialog open={openDialog === "abort"} onClose={() => setOpenDialog(null)}>
        <DialogTitle>Beoordeling afbreken</DialogTitle>
        <DialogDescription>
          Weet je zeker dat je de beoordeling wilt afbreken? Dit kan niet
          ongedaan worden gemaakt.
        </DialogDescription>
        <DialogBody>
          <Field>
            <Label>Reden voor afbreken</Label>
            <Textarea
              value={abortReason}
              onChange={(e) => setAbortReason(e.target.value)}
              placeholder="Geef een reden op..."
              rows={3}
              required
            />
          </Field>
        </DialogBody>
        <DialogActions>
          <Button
            plain
            onClick={() => {
              setOpenDialog(null);
              setAbortReason("");
            }}
          >
            Annuleren
          </Button>
          <Button
            color="red"
            onClick={handleAbort}
            disabled={isSubmitting || !abortReason.trim()}
          >
            {abortAction.status === "executing" ? "Bezig..." : "Afbreken"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Finalize Dialog */}
      <Dialog
        open={openDialog === "finalize"}
        onClose={() => setOpenDialog(null)}
      >
        <DialogTitle>Beoordeling afronden</DialogTitle>
        <DialogDescription>
          Weet je zeker dat je de beoordeling wilt afronden? Controleer of alle
          onderdelen zijn beoordeeld.
        </DialogDescription>
        <DialogActions>
          <Button plain onClick={() => setOpenDialog(null)}>
            Annuleren
          </Button>
          <Button
            color="green"
            onClick={handleFinalize}
            disabled={isSubmitting}
          >
            {finalizeAction.status === "executing" ? "Bezig..." : "Afronden"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
