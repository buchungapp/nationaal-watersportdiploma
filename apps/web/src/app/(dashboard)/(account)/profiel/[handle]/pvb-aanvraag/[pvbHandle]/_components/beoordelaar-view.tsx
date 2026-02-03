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
import {
  abortPvbAction,
  finalizePvbAssessmentAction,
  startPvbAssessmentAction,
} from "~/app/_actions/pvb/assessment-action";
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
import type {
  getPvbBeoordelingsCriteria,
  getPvbToetsdocumenten,
  retrievePvbAanvraagByHandle,
} from "~/lib/nwd";

interface BeoordelaarViewProps {
  aanvraag: Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>;
  toetsdocumentenList: Awaited<ReturnType<typeof getPvbToetsdocumenten>>;
  beoordelingsCriteria: Awaited<
    ReturnType<typeof getPvbBeoordelingsCriteria>
  >["items"];
  personId: string;
}

export function BeoordelaarView({
  aanvraag,
  toetsdocumentenList,
  beoordelingsCriteria,
  personId,
}: BeoordelaarViewProps) {
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

  // Create maps for quick lookups similar to AssessmentView
  const onderdeelDataMap = new Map(
    aanvraag.onderdelen.map((onderdeel) => [
      onderdeel.kerntaakOnderdeelId,
      onderdeel,
    ]),
  );

  const criteriaStatusMap = new Map(
    beoordelingsCriteria.map((criteria) => [
      `${criteria.pvbOnderdeelId}___${criteria.beoordelingscriteriumId}`,
      criteria,
    ]),
  );

  const areAllCriteriaAssessed = (): boolean => {
    // Check all onderdelen where the current person is the beoordelaar
    for (const onderdeelData of aanvraag.onderdelen) {
      // Skip onderdelen where the current person is not the beoordelaar
      if (onderdeelData.beoordelaar?.id !== personId) {
        continue;
      }

      // Find the kerntaak and onderdeel in toetsdocumenten
      let allCriteriaAssessed = false;

      for (const toetsdocument of toetsdocumentenList) {
        const kerntaak = toetsdocument.kerntaken.find((k) =>
          k.onderdelen.some(
            (o) => onderdeelDataMap.get(o.id)?.id === onderdeelData.id,
          ),
        );
        if (!kerntaak) continue;

        const onderdeel = kerntaak.onderdelen.find(
          (o) => onderdeelDataMap.get(o.id)?.id === onderdeelData.id,
        );
        if (!onderdeel) continue;

        // Get all criteria for this onderdeel
        const allCriteriaIds: string[] = [];
        for (const werkproces of onderdeel.werkprocessen) {
          for (const criterium of werkproces.beoordelingscriteria) {
            allCriteriaIds.push(criterium.id);
          }
        }

        // Check if all criteria have been assessed (behaald !== null)
        let allAssessed = true;
        for (const criteriumId of allCriteriaIds) {
          const key = `${onderdeelData.id}___${criteriumId}`;
          const status = criteriaStatusMap.get(key);
          if (!status || status.behaald === null) {
            allAssessed = false;
            break;
          }
        }

        if (allAssessed) {
          allCriteriaAssessed = true;
          break;
        }
      }

      // If any onderdeel is not fully assessed, return false
      if (!allCriteriaAssessed) {
        return false;
      }
    }

    return true;
  };

  const canStart = aanvraag.status === "gereed_voor_beoordeling";
  const canAbort = aanvraag.status === "in_beoordeling";

  // Use the same logic as AssessmentView to check if all criteria are assessed
  const canFinalize =
    aanvraag.status === "in_beoordeling" && areAllCriteriaAssessed();

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
          Weet je zeker dat je de beoordeling wilt afronden? Je kan de uitslag
          daarna niet meer wijzigen. Neem contact op met het Secretariaat als er
          nog vragen zijn.
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
