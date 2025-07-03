"use client";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Combobox,
  ComboboxLabel,
  ComboboxOption,
} from "~/app/(dashboard)/_components/combobox";
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
import { Input } from "~/app/(dashboard)/_components/input";
import { usePersonsForLocation } from "~/app/(dashboard)/_hooks/swr/use-persons-for-location";
import type { listPvbs } from "~/lib/nwd";

type PvbAanvraag = Awaited<ReturnType<typeof listPvbs>>[number];
type Person = {
  id: string;
  firstName?: string | null;
  lastNamePrefix?: string | null;
  lastName?: string | null;
  email?: string | null;
};

interface PvbTableActionsProps {
  selectedPvbs: PvbAanvraag[];
  locationId: string;
  onUpdateStartTime: (pvbIds: string[], startTime: string) => Promise<void>;
  onUpdateLeercoach: (pvbIds: string[], leercoachId: string) => Promise<void>;
  onUpdateBeoordelaar: (
    pvbIds: string[],
    beoordelaarId: string,
  ) => Promise<void>;
  onCancel: (pvbIds: string[]) => Promise<void>;
  onSubmit: (pvbIds: string[]) => Promise<void>;
  onClearSelection: () => void;
}

// Helper function to format person names
function formatPersonName(person: Person): string {
  const parts = [person.firstName, person.lastNamePrefix, person.lastName]
    .filter(Boolean)
    .join(" ");
  return parts || "Onbekend";
}

type DialogType =
  | "startTime"
  | "leercoach"
  | "beoordelaar"
  | "cancel"
  | "submit"
  | null;

export function PvbTableActions({
  selectedPvbs,
  locationId,
  onUpdateStartTime,
  onUpdateLeercoach,
  onUpdateBeoordelaar,
  onCancel,
  onSubmit,
  onClearSelection,
}: PvbTableActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [startDateTime, setStartDateTime] = useState("");
  const [selectedLeercoach, setSelectedLeercoach] = useState<Person | null>(
    null,
  );
  const [selectedBeoordelaar, setSelectedBeoordelaar] = useState<Person | null>(
    null,
  );
  const [leercoachQuery, setLeercoachQuery] = useState("");
  const [beoordelaarQuery, setBeoordelaarQuery] = useState("");

  // Get instructors and beoordelaars
  const { data: instructors } = usePersonsForLocation(
    locationId,
    {
      filter: { actorType: "instructor", query: leercoachQuery },
    },
    {
      enabled: activeDialog === "leercoach",
    },
  );

  const { data: beoordelaars } = usePersonsForLocation(
    locationId,
    {
      filter: { actorType: "pvb_beoordelaar", query: beoordelaarQuery },
    },
    {
      enabled: activeDialog === "beoordelaar",
    },
  );

  // Calculate what actions are available
  const selectedIds = selectedPvbs.map((pvb) => pvb.id);
  const canSubmit = selectedPvbs.some((pvb) => pvb.status === "concept");
  const canCancel = selectedPvbs.some((pvb) =>
    ["concept", "wacht_op_voorwaarden", "gereed_voor_beoordeling"].includes(
      pvb.status,
    ),
  );
  const canAssignBeoordelaar = selectedPvbs.every(
    (pvb) => pvb.type === "intern",
  );

  // Reset form state when dialog closes
  useEffect(() => {
    if (!activeDialog) {
      setStartDateTime("");
      setSelectedLeercoach(null);
      setSelectedBeoordelaar(null);
      setLeercoachQuery("");
      setBeoordelaarQuery("");
    }
  }, [activeDialog]);

  const closeDialog = () => {
    setActiveDialog(null);
    setIsProcessing(false);
  };

  const handleUpdateStartTime = async () => {
    if (!startDateTime) return;
    setIsProcessing(true);
    try {
      await onUpdateStartTime(selectedIds, startDateTime);
      toast.success(
        `Aanvangsdatum is bijgewerkt voor ${selectedIds.length} aanvragen.`,
      );
      closeDialog();
      onClearSelection();
    } catch (error) {
      toast.error(
        "Er is iets misgegaan bij het bijwerken van de aanvangsdatum.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateLeercoach = async () => {
    if (!selectedLeercoach) return;
    setIsProcessing(true);
    try {
      await onUpdateLeercoach(selectedIds, selectedLeercoach.id);
      toast.success(
        `${formatPersonName(selectedLeercoach)} is toegewezen aan ${selectedIds.length} aanvragen.`,
      );
      closeDialog();
      onClearSelection();
    } catch (error) {
      toast.error("Er is iets misgegaan bij het toewijzen van de leercoach.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateBeoordelaar = async () => {
    if (!selectedBeoordelaar) return;
    setIsProcessing(true);
    try {
      await onUpdateBeoordelaar(selectedIds, selectedBeoordelaar.id);
      toast.success(
        `${formatPersonName(selectedBeoordelaar)} is toegewezen aan ${selectedIds.length} aanvragen.`,
      );
      closeDialog();
      onClearSelection();
    } catch (error) {
      toast.error("Er is iets misgegaan bij het toewijzen van de beoordelaar.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await onCancel(selectedIds);
      toast.success(`${selectedIds.length} aanvragen zijn geannuleerd.`);
      closeDialog();
      onClearSelection();
    } catch (error) {
      toast.error("Er is iets misgegaan bij het annuleren van de aanvragen.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await onSubmit(selectedIds);
      toast.success(`${selectedIds.length} aanvragen zijn ingediend.`);
      closeDialog();
      onClearSelection();
    } catch (error) {
      toast.error("Er is iets misgegaan bij het indienen van de aanvragen.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedPvbs.length === 0) {
    return null;
  }

  return (
    <>
      <Dropdown>
        <DropdownButton color="zinc">
          Bulk acties ({selectedIds.length})
        </DropdownButton>
        <DropdownMenu anchor="top">
          <DropdownItem onClick={() => setActiveDialog("startTime")}>
            Aanvangsdatum/tijd aanpassen
          </DropdownItem>

          <DropdownItem onClick={() => setActiveDialog("leercoach")}>
            Leercoach toewijzen
          </DropdownItem>

          {canAssignBeoordelaar && (
            <DropdownItem onClick={() => setActiveDialog("beoordelaar")}>
              Beoordelaar toewijzen
            </DropdownItem>
          )}

          {(canSubmit || canCancel) && <hr className="my-1" />}

          {canSubmit && (
            <DropdownItem onClick={() => setActiveDialog("submit")}>
              Indienen ({selectedIds.length})
            </DropdownItem>
          )}

          {canCancel && (
            <DropdownItem onClick={() => setActiveDialog("cancel")}>
              Annuleren ({selectedIds.length})
            </DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>

      {/* Start Time Dialog */}
      <Dialog open={activeDialog === "startTime"} onClose={closeDialog}>
        <DialogTitle>Aanvangsdatum/tijd aanpassen</DialogTitle>
        <DialogDescription>
          Pas de aanvangsdatum en tijd aan voor {selectedIds.length}{" "}
          geselecteerde aanvragen.
        </DialogDescription>
        <DialogBody>
          <Field>
            <Label>Datum en tijd</Label>
            <Input
              type="datetime-local"
              value={startDateTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setStartDateTime(e.target.value)
              }
              className="w-full"
            />
          </Field>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={closeDialog}>
            Annuleren
          </Button>
          <Button
            color="blue"
            onClick={handleUpdateStartTime}
            disabled={isProcessing || !startDateTime}
          >
            Bijwerken
          </Button>
        </DialogActions>
      </Dialog>

      {/* Leercoach Dialog */}
      <Dialog open={activeDialog === "leercoach"} onClose={closeDialog}>
        <DialogTitle>Leercoach toewijzen</DialogTitle>
        <DialogDescription>
          Wijs een leercoach toe aan {selectedIds.length} geselecteerde
          aanvragen.
        </DialogDescription>
        <DialogBody>
          <Field>
            <Label>Leercoach</Label>
            <Combobox
              options={instructors?.items ?? []}
              value={selectedLeercoach}
              onChange={setSelectedLeercoach}
              displayValue={(person) =>
                person ? formatPersonName(person as Person) : ""
              }
              setQuery={setLeercoachQuery}
              filter={() => true}
              placeholder="Selecteer leercoach..."
            >
              {(person: Person) => (
                <ComboboxOption key={person.id} value={person}>
                  <ComboboxLabel>
                    <div className="flex">
                      <span className="truncate">
                        {formatPersonName(person)}
                      </span>
                      {person.email && (
                        <span className="ml-2 text-slate-500 group-data-active/option:text-white truncate">
                          ({person.email})
                        </span>
                      )}
                    </div>
                  </ComboboxLabel>
                </ComboboxOption>
              )}
            </Combobox>
          </Field>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={closeDialog}>
            Annuleren
          </Button>
          <Button
            color="blue"
            onClick={handleUpdateLeercoach}
            disabled={isProcessing || !selectedLeercoach}
          >
            Toewijzen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Beoordelaar Dialog */}
      <Dialog open={activeDialog === "beoordelaar"} onClose={closeDialog}>
        <DialogTitle>Beoordelaar toewijzen</DialogTitle>
        <DialogDescription>
          Wijs een beoordelaar toe aan {selectedIds.length} geselecteerde
          aanvragen. Dit zal de beoordelaar toewijzen aan alle onderdelen van de
          geselecteerde aanvragen.
        </DialogDescription>
        <DialogBody>
          <Field>
            <Label>Beoordelaar</Label>
            <Combobox
              options={beoordelaars?.items ?? []}
              value={selectedBeoordelaar}
              onChange={setSelectedBeoordelaar}
              displayValue={(person) =>
                person ? formatPersonName(person as Person) : ""
              }
              setQuery={setBeoordelaarQuery}
              filter={() => true}
              placeholder="Selecteer beoordelaar..."
            >
              {(person: Person) => (
                <ComboboxOption key={person.id} value={person}>
                  <ComboboxLabel>
                    <div className="flex">
                      <span className="truncate">
                        {formatPersonName(person)}
                      </span>
                      {person.email && (
                        <span className="ml-2 text-slate-500 group-data-active/option:text-white truncate">
                          ({person.email})
                        </span>
                      )}
                    </div>
                  </ComboboxLabel>
                </ComboboxOption>
              )}
            </Combobox>
          </Field>
          {beoordelaars?.items?.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
              <div className="text-sm font-medium text-amber-900">
                Er zijn geen beoordelaars gevonden op deze locatie
              </div>
              <div className="text-xs text-amber-700 mt-1">
                Beoordelaars worden aangewezen door personen binnen de locatie
                te voorzien van de 'interne beoordelaar' rol.
              </div>
            </div>
          )}
        </DialogBody>
        <DialogActions>
          <Button plain onClick={closeDialog}>
            Annuleren
          </Button>
          <Button
            color="blue"
            onClick={handleUpdateBeoordelaar}
            disabled={isProcessing || !selectedBeoordelaar}
          >
            Toewijzen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={activeDialog === "cancel"} onClose={closeDialog}>
        <DialogTitle>Aanvragen annuleren</DialogTitle>
        <DialogDescription>
          Weet je zeker dat je {selectedIds.length} aanvragen wilt annuleren?
          Deze actie kan niet ongedaan worden gemaakt.
        </DialogDescription>
        <DialogActions>
          <Button plain onClick={closeDialog}>
            Terug
          </Button>
          <Button color="red" onClick={handleCancel} disabled={isProcessing}>
            Annuleren
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Dialog */}
      <Dialog open={activeDialog === "submit"} onClose={closeDialog}>
        <DialogTitle>Aanvragen indienen</DialogTitle>
        <DialogDescription>
          Je staat op het punt om {selectedIds.length} aanvragen in te dienen.
          Hierna worden de voorwaarden gecontroleerd en kunnen de aanvragen niet
          meer teruggedraaid worden naar concept status.
        </DialogDescription>
        <DialogActions>
          <Button plain onClick={closeDialog}>
            Terug
          </Button>
          <Button color="blue" onClick={handleSubmit} disabled={isProcessing}>
            Indienen
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
