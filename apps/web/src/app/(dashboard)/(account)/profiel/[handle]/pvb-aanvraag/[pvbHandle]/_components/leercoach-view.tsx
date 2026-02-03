"use client";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  XCircleIcon,
} from "@heroicons/react/16/solid";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import {
  denyLeercoachPermissionAction,
  grantLeercoachPermissionAction,
} from "~/app/_actions/pvb/leercoach-permission-action";
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
import type { retrievePvbAanvraagByHandle } from "~/lib/nwd";

interface LeercoachViewProps {
  aanvraag: Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>;
  personId: string;
}

export function LeercoachView({ aanvraag, personId }: LeercoachViewProps) {
  const [openDialog, setOpenDialog] = useState<"grant" | "deny" | null>(null);
  const [grantRemarks, setGrantRemarks] = useState("");
  const [denyReason, setDenyReason] = useState("");

  // Action hooks
  const grantAction = useAction(grantLeercoachPermissionAction);
  const denyAction = useAction(denyLeercoachPermissionAction);

  // Check if user is the leercoach
  const isLeercoach = aanvraag.leercoach?.id === personId;

  if (!isLeercoach) {
    return null;
  }

  const canGivePermission =
    aanvraag.status === "wacht_op_voorwaarden" &&
    aanvraag.leercoach?.status === "gevraagd";

  const handleGrant = () => {
    grantAction.execute({
      handle: aanvraag.handle,
      pvbAanvraagId: aanvraag.id,
      remarks: grantRemarks,
    });
  };

  const handleDeny = () => {
    if (!denyReason.trim()) {
      toast.error("Vul een reden in");
      return;
    }

    denyAction.execute({
      handle: aanvraag.handle,
      pvbAanvraagId: aanvraag.id,
      reason: denyReason,
    });
  };

  // Handle action results
  if (grantAction.result.data) {
    toast.success(grantAction.result.data.message);
    setOpenDialog(null);
    setGrantRemarks("");
    grantAction.reset();
  } else if (grantAction.result.serverError) {
    toast.error(grantAction.result.serverError);
  }

  if (denyAction.result.data) {
    toast.success(denyAction.result.data.message);
    setOpenDialog(null);
    setDenyReason("");
    denyAction.reset();
  } else if (denyAction.result.serverError) {
    toast.error(denyAction.result.serverError);
  }

  const isSubmitting =
    grantAction.status === "executing" || denyAction.status === "executing";

  if (!canGivePermission) {
    return null;
  }

  return (
    <>
      <Dropdown>
        <DropdownButton color="dark/white">
          Toestemming
          <ChevronDownIcon />
        </DropdownButton>
        <DropdownMenu>
          <DropdownItem onClick={() => setOpenDialog("grant")}>
            <CheckCircleIcon data-slot="icon" />
            Toestemming verlenen
          </DropdownItem>
          <DropdownItem onClick={() => setOpenDialog("deny")}>
            <XCircleIcon data-slot="icon" />
            Toestemming weigeren
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      {/* Grant Dialog */}
      <Dialog open={openDialog === "grant"} onClose={() => setOpenDialog(null)}>
        <DialogTitle>Toestemming verlenen</DialogTitle>
        <DialogDescription>
          Je staat op het punt om toestemming te verlenen voor deze PvB
          aanvraag. Zodra aan alle voorwaarden is voldaan, kan de aanvraag
          beoordeeld worden.
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
              setOpenDialog(null);
              setGrantRemarks("");
            }}
          >
            Annuleren
          </Button>
          <Button color="green" onClick={handleGrant} disabled={isSubmitting}>
            {grantAction.status === "executing"
              ? "Bezig..."
              : "Toestemming verlenen"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deny Dialog */}
      <Dialog open={openDialog === "deny"} onClose={() => setOpenDialog(null)}>
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
              setOpenDialog(null);
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
            {denyAction.status === "executing"
              ? "Bezig..."
              : "Toestemming weigeren"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
