"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  PlayIcon,
  XCircleIcon,
} from "@heroicons/react/16/solid";
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
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isAbortDialogOpen, setIsAbortDialogOpen] = useState(false);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [abortReason, setAbortReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is beoordelaar for any onderdeel
  const isBeoordelaar = aanvraag.onderdelen.some(
    (onderdeel) => onderdeel.beoordelaar?.id === personId
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
        onderdeel.uitslag !== "nog_niet_bekend"
    );

  const handleStart = async () => {
    setIsSubmitting(true);
    try {
      const result = await startPvbAssessmentAction({
        handle: aanvraag.handle,
        pvbAanvraagId: aanvraag.id,
      });

      if (result?.success) {
        toast.success(result.message);
        setIsStartDialogOpen(false);
      } else {
        throw new Error("Er is een fout opgetreden");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Er is een fout opgetreden bij het starten"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAbort = async () => {
    if (!abortReason.trim()) {
      toast.error("Vul een reden in");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await abortPvbAction({
        handle: aanvraag.handle,
        pvbAanvraagId: aanvraag.id,
        reason: abortReason,
      });

      if (result?.success) {
        toast.success(result.message);
        setIsAbortDialogOpen(false);
        setAbortReason("");
      } else {
        throw new Error("Er is een fout opgetreden");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Er is een fout opgetreden bij het afbreken"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    setIsSubmitting(true);
    try {
      const result = await finalizePvbAssessmentAction({
        handle: aanvraag.handle,
        pvbAanvraagId: aanvraag.id,
      });

      if (result?.success) {
        toast.success(result.message);
        setIsFinalizeDialogOpen(false);
      } else {
        throw new Error("Er is een fout opgetreden");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Er is een fout opgetreden bij het afronden"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Menu>
        <MenuButton as={Button} color="dark/white">
          Acties
          <ChevronDownIcon />
        </MenuButton>
        <MenuItems anchor="bottom end" className="z-10">
          {canStart && (
            <MenuItem>
              <button
                onClick={() => setIsStartDialogOpen(true)}
                className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
              >
                <PlayIcon className="size-4 fill-white/30" />
                Beoordeling starten
              </button>
            </MenuItem>
          )}
          {canAbort && (
            <MenuItem>
              <button
                onClick={() => setIsAbortDialogOpen(true)}
                className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
              >
                <XCircleIcon className="size-4 fill-white/30" />
                Beoordeling afbreken
              </button>
            </MenuItem>
          )}
          {canFinalize && (
            <MenuItem>
              <button
                onClick={() => setIsFinalizeDialogOpen(true)}
                className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
              >
                <CheckCircleIcon className="size-4 fill-white/30" />
                Beoordeling afronden
              </button>
            </MenuItem>
          )}
        </MenuItems>
      </Menu>

      {/* Start Dialog */}
      <Dialog open={isStartDialogOpen} onClose={setIsStartDialogOpen}>
        <DialogTitle>Beoordeling starten</DialogTitle>
        <DialogDescription>
          Weet je zeker dat je de beoordeling wilt starten? De status van de
          aanvraag wordt gewijzigd naar "In beoordeling".
        </DialogDescription>
        <DialogActions>
          <Button plain onClick={() => setIsStartDialogOpen(false)}>
            Annuleren
          </Button>
          <Button color="green" onClick={handleStart} disabled={isSubmitting}>
            {isSubmitting ? "Bezig..." : "Starten"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Abort Dialog */}
      <Dialog open={isAbortDialogOpen} onClose={setIsAbortDialogOpen}>
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
              setIsAbortDialogOpen(false);
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
            {isSubmitting ? "Bezig..." : "Afbreken"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Finalize Dialog */}
      <Dialog open={isFinalizeDialogOpen} onClose={setIsFinalizeDialogOpen}>
        <DialogTitle>Beoordeling afronden</DialogTitle>
        <DialogDescription>
          Weet je zeker dat je de beoordeling wilt afronden? Controleer of alle
          onderdelen zijn beoordeeld.
        </DialogDescription>
        <DialogActions>
          <Button plain onClick={() => setIsFinalizeDialogOpen(false)}>
            Annuleren
          </Button>
          <Button
            color="green"
            onClick={handleFinalize}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Bezig..." : "Afronden"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}