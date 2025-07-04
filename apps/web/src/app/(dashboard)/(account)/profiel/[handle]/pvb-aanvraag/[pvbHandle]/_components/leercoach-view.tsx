"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  CheckCircleIcon,
  ChevronDownIcon,
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
  denyLeercoachPermissionAction,
  grantLeercoachPermissionAction,
} from "~/app/_actions/pvb/leercoach-permission-action";
import type { retrievePvbAanvraagByHandle } from "~/lib/nwd";

interface LeercoachViewProps {
  aanvraag: Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>;
  personId: string;
}

export function LeercoachView({ aanvraag, personId }: LeercoachViewProps) {
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [isDenyDialogOpen, setIsDenyDialogOpen] = useState(false);
  const [grantRemarks, setGrantRemarks] = useState("");
  const [denyReason, setDenyReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is the leercoach
  const isLeercoach = aanvraag.leercoach?.id === personId;

  if (!isLeercoach) {
    return null;
  }

  const canGivePermission =
    aanvraag.status === "wacht_op_voorwaarden" &&
    aanvraag.leercoach?.status === "gevraagd";

  const handleGrant = async () => {
    setIsSubmitting(true);
    try {
      const result = await grantLeercoachPermissionAction({
        handle: aanvraag.handle,
        pvbAanvraagId: aanvraag.id,
        remarks: grantRemarks,
      });

      if (result?.success) {
        toast.success(result.message);
        setIsGrantDialogOpen(false);
        setGrantRemarks("");
      } else {
        throw new Error("Er is een fout opgetreden");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Er is een fout opgetreden bij het verlenen van toestemming"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeny = async () => {
    if (!denyReason.trim()) {
      toast.error("Vul een reden in");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await denyLeercoachPermissionAction({
        handle: aanvraag.handle,
        pvbAanvraagId: aanvraag.id,
        reason: denyReason,
      });

      if (result?.success) {
        toast.success(result.message);
        setIsDenyDialogOpen(false);
        setDenyReason("");
      } else {
        throw new Error("Er is een fout opgetreden");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Er is een fout opgetreden bij het weigeren van toestemming"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canGivePermission) {
    return null;
  }

  return (
    <>
      <Menu>
        <MenuButton as={Button} color="dark/white">
          Toestemming
          <ChevronDownIcon />
        </MenuButton>
        <MenuItems anchor="bottom end" className="z-10">
          <MenuItem>
            <button
              onClick={() => setIsGrantDialogOpen(true)}
              className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
            >
              <CheckCircleIcon className="size-4 fill-white/30" />
              Toestemming verlenen
            </button>
          </MenuItem>
          <MenuItem>
            <button
              onClick={() => setIsDenyDialogOpen(true)}
              className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
            >
              <XCircleIcon className="size-4 fill-white/30" />
              Toestemming weigeren
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>

      {/* Grant Dialog */}
      <Dialog open={isGrantDialogOpen} onClose={setIsGrantDialogOpen}>
        <DialogTitle>Toestemming verlenen</DialogTitle>
        <DialogDescription>
          Je staat op het punt om toestemming te verlenen voor deze PvB
          aanvraag. Hierna kan de beoordeling worden gestart.
        </DialogDescription>
        <DialogBody>
          <Field>
            <Label>Opmerkingen (optioneel)</Label>
            <Textarea
              value={grantRemarks}
              onChange={(e) => setGrantRemarks(e.target.value)}
              placeholder="Eventuele opmerkingen..."
              rows={3}
            />
          </Field>
        </DialogBody>
        <DialogActions>
          <Button
            plain
            onClick={() => {
              setIsGrantDialogOpen(false);
              setGrantRemarks("");
            }}
          >
            Annuleren
          </Button>
          <Button color="green" onClick={handleGrant} disabled={isSubmitting}>
            {isSubmitting ? "Bezig..." : "Toestemming verlenen"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deny Dialog */}
      <Dialog open={isDenyDialogOpen} onClose={setIsDenyDialogOpen}>
        <DialogTitle>Toestemming weigeren</DialogTitle>
        <DialogDescription>
          Weet je zeker dat je de toestemming wilt weigeren? De aanvraag kan
          hierna niet worden beoordeeld.
        </DialogDescription>
        <DialogBody>
          <Field>
            <Label>Reden voor weigering</Label>
            <Textarea
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
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
              setIsDenyDialogOpen(false);
              setDenyReason("");
            }}
          >
            Annuleren
          </Button>
          <Button
            color="red"
            onClick={handleDeny}
            disabled={isSubmitting || !denyReason.trim()}
          >
            {isSubmitting ? "Bezig..." : "Toestemming weigeren"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}