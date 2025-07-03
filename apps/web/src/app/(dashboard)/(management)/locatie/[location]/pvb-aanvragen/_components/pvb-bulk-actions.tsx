"use client";

import {
  CalendarIcon,
  ClockIcon,
  PlayIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import { useState } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import {
  Field,
  FieldGroup,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { Select } from "~/app/(dashboard)/_components/select";
import type { listPvbs } from "~/lib/nwd";

type PvbAanvraag = Awaited<ReturnType<typeof listPvbs>>["items"][number];

interface PvbBulkActionsProps {
  selectedIds: string[];
  selectedPvbs: PvbAanvraag[];
  onComplete: () => void;
}

type ActionType =
  | "adjust-datetime"
  | "assign-leercoach"
  | "cancel"
  | "kick-off"
  | null;

export function PvbBulkActions({
  selectedIds,
  selectedPvbs,
  onComplete,
}: PvbBulkActionsProps) {
  const [currentAction, setCurrentAction] = useState<ActionType>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [aanvangsdatum, setAanvangsdatum] = useState("");
  const [aanvangstijd, setAanvangstijd] = useState("");
  const [selectedLeercoach, setSelectedLeercoach] = useState("");

  const canKickOff = selectedPvbs.every((pvb) => pvb.status === "concept");
  const canCancel = selectedPvbs.every((pvb) =>
    ["concept", "wacht_op_voorwaarden", "gepland"].includes(pvb.status),
  );

  const handleAction = async (action: ActionType) => {
    setCurrentAction(action);

    // Set default values for datetime if adjusting
    if (action === "adjust-datetime") {
      const now = new Date();
      setAanvangsdatum(now.toISOString().split("T")[0]);
      setAanvangstijd(now.toTimeString().slice(0, 5));
    }
  };

  const handleSubmit = async () => {
    if (!currentAction || selectedIds.length === 0) return;

    setIsLoading(true);

    try {
      switch (currentAction) {
        case "adjust-datetime":
          // TODO: Call API to bulk update aanvangsdatum/tijd
          console.log("Adjusting datetime for:", selectedIds, {
            aanvangsdatum,
            aanvangstijd,
          });
          break;

        case "assign-leercoach":
          // TODO: Call API to bulk update leercoach
          console.log("Assigning leercoach for:", selectedIds, {
            selectedLeercoach,
          });
          break;

        case "cancel":
          // TODO: Call API to cancel selected aanvragen
          console.log("Cancelling PVB aanvragen:", selectedIds);
          break;

        case "kick-off":
          // TODO: Call API to kick off selected aanvragen
          console.log("Kicking off PVB aanvragen:", selectedIds);
          break;
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onComplete();
      setCurrentAction(null);
    } catch (error) {
      console.error("Error performing bulk action:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionTitle = () => {
    switch (currentAction) {
      case "adjust-datetime":
        return "Aanvangsdatum/tijd aanpassen";
      case "assign-leercoach":
        return "Leercoach toewijzen";
      case "cancel":
        return "Aanvragen annuleren";
      case "kick-off":
        return "Aanvragen starten";
      default:
        return "";
    }
  };

  const getActionDescription = () => {
    const count = selectedIds.length;
    switch (currentAction) {
      case "adjust-datetime":
        return `Pas de aanvangsdatum en tijd aan voor ${count} geselecteerde aanvra${
          count === 1 ? "ag" : "gen"
        }.`;
      case "assign-leercoach":
        return `Wijs een leercoach toe aan ${count} geselecteerde aanvra${
          count === 1 ? "ag" : "gen"
        }.`;
      case "cancel":
        return `Annuleer ${count} geselecteerde aanvra${
          count === 1 ? "ag" : "gen"
        }. Deze actie kan niet ongedaan gemaakt worden.`;
      case "kick-off":
        return `Start ${count} geselecteerde aanvra${
          count === 1 ? "ag" : "gen"
        } vanuit concept status. Ze worden verplaatst naar 'wacht op voorwaarden' of direct naar 'gepland' als alle vereisten vervuld zijn.`;
      default:
        return "";
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          color="dark/zinc"
          onClick={() => handleAction("adjust-datetime")}
          disabled={selectedIds.length === 0}
        >
          <CalendarIcon />
          Datum/tijd aanpassen
        </Button>

        <Button
          color="dark/zinc"
          onClick={() => handleAction("assign-leercoach")}
          disabled={selectedIds.length === 0}
        >
          <UserIcon />
          Leercoach toewijzen
        </Button>

        <Button
          color="red"
          onClick={() => handleAction("cancel")}
          disabled={selectedIds.length === 0 || !canCancel}
        >
          <XMarkIcon />
          Annuleren
        </Button>

        <Button
          color="emerald"
          onClick={() => handleAction("kick-off")}
          disabled={selectedIds.length === 0 || !canKickOff}
        >
          <PlayIcon />
          Aanvraag starten
        </Button>
      </div>

      <Dialog
        open={currentAction !== null}
        onClose={() => setCurrentAction(null)}
      >
        <DialogTitle>{getActionTitle()}</DialogTitle>
        <DialogDescription>{getActionDescription()}</DialogDescription>
        <DialogBody>
          {currentAction === "adjust-datetime" && (
            <FieldGroup>
              <Field>
                <Label>Aanvangsdatum</Label>
                <Input
                  type="date"
                  value={aanvangsdatum}
                  onChange={(e) => setAanvangsdatum(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <Label>Aanvangstijd (optioneel)</Label>
                <Input
                  type="time"
                  value={aanvangstijd}
                  onChange={(e) => setAanvangstijd(e.target.value)}
                />
              </Field>
            </FieldGroup>
          )}

          {currentAction === "assign-leercoach" && (
            <FieldGroup>
              <Field>
                <Label>Leercoach</Label>
                <Select
                  value={selectedLeercoach}
                  onChange={(e) => setSelectedLeercoach(e.target.value)}
                  required
                >
                  <option value="">Selecteer een leercoach...</option>
                  <option value="mock-person-2">Maria Janssen</option>
                  <option value="mock-person-5">Jan van Dijk</option>
                  <option value="remove">Leercoach verwijderen</option>
                </Select>
              </Field>
            </FieldGroup>
          )}

          {currentAction === "cancel" && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">
                <strong>Let op:</strong> Deze actie kan niet ongedaan gemaakt
                worden. De geselecteerde aanvragen worden gemarkeerd als
                geannuleerd.
              </div>
            </div>
          )}

          {currentAction === "kick-off" && (
            <div className="rounded-md bg-blue-50 p-4">
              <div className="text-sm text-blue-700">
                De aanvragen worden automatisch doorgeschakeld naar de volgende
                status op basis van vervulde voorwaarden (beoordelaar,
                hoofdcursus, datum).
              </div>
            </div>
          )}
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setCurrentAction(null)}>
            Annuleren
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            color={currentAction === "cancel" ? "red" : "dark/zinc"}
          >
            {isLoading ? "Bezig..." : "Bevestigen"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
