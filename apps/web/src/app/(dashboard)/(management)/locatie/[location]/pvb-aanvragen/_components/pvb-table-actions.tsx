"use client";

import { CalendarIcon, UserIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
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
import { Field, Label } from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { usePersonsForLocation } from "~/app/(dashboard)/_hooks/swr/use-persons-for-location";
import type { listPvbs } from "~/lib/nwd";

type PvbAanvraag = Awaited<ReturnType<typeof listPvbs>>[number];

interface PvbTableActionsProps {
  selectedPvbs: PvbAanvraag[];
  locationId: string;
  onUpdateStartTime: (pvbIds: string[], startTime: string) => Promise<void>;
  onUpdateLeercoach: (pvbIds: string[], leercoachId: string) => Promise<void>;
  onCancel: (pvbIds: string[]) => Promise<void>;
  onSubmit: (pvbIds: string[]) => Promise<void>;
  onClearSelection: () => void;
}

interface Person {
  id: string;
  firstName: string;
  lastName: string | null;
  lastNamePrefix: string | null;
  email: string | null;
}

export function PvbTableActions({
  selectedPvbs,
  locationId,
  onUpdateStartTime,
  onUpdateLeercoach,
  onCancel,
  onSubmit,
  onClearSelection,
}: PvbTableActionsProps) {
  const [startTimeDialogOpen, setStartTimeDialogOpen] = useState(false);
  const [leercoachDialogOpen, setLeercoachDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  const [startDateTime, setStartDateTime] = useState("");
  const [selectedLeercoach, setSelectedLeercoach] = useState<Person | null>(
    null,
  );
  const [leercoachQuery, setLeercoachQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: instructors } = usePersonsForLocation(locationId, {
    filter: { query: leercoachQuery, actorType: "instructor" },
  });

  const selectedIds = selectedPvbs.map((pvb) => pvb.id);
  const canSubmit = selectedPvbs.every((pvb) => pvb.status === "concept");
  const canCancel = selectedPvbs.every((pvb) =>
    ["concept", "wacht_op_voorwaarden", "gereed_voor_beoordeling"].includes(
      pvb.status,
    ),
  );

  const formatPersonName = (person: Person) => {
    const parts = [person.firstName];
    if (person.lastNamePrefix) parts.push(person.lastNamePrefix);
    if (person.lastName) parts.push(person.lastName);
    return parts.join(" ");
  };

  const handleUpdateStartTime = async () => {
    if (!startDateTime) {
      toast.error("Selecteer een datum en tijd");
      return;
    }

    setIsProcessing(true);
    try {
      await onUpdateStartTime(selectedIds, startDateTime);
      toast.success(
        `Aanvangsdatum/tijd bijgewerkt voor ${selectedIds.length} aanvragen`,
      );
      setStartTimeDialogOpen(false);
      onClearSelection();
    } catch (error) {
      toast.error("Er is een fout opgetreden bij het bijwerken");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateLeercoach = async () => {
    if (!selectedLeercoach) {
      toast.error("Selecteer een leercoach");
      return;
    }

    setIsProcessing(true);
    try {
      await onUpdateLeercoach(selectedIds, selectedLeercoach.id);
      toast.success(
        `Leercoach bijgewerkt voor ${selectedIds.length} aanvragen`,
      );
      setLeercoachDialogOpen(false);
      onClearSelection();
    } catch (error) {
      toast.error("Er is een fout opgetreden bij het bijwerken");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await onCancel(selectedIds);
      toast.success(`${selectedIds.length} aanvragen geannuleerd`);
      setCancelDialogOpen(false);
      onClearSelection();
    } catch (error) {
      toast.error("Er is een fout opgetreden bij het annuleren");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      await onSubmit(selectedIds);
      toast.success(`${selectedIds.length} aanvragen ingediend`);
      setSubmitDialogOpen(false);
      onClearSelection();
    } catch (error) {
      toast.error("Er is een fout opgetreden bij het indienen");
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedPvbs.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex gap-2">
        <Button color="zinc" onClick={() => setStartTimeDialogOpen(true)}>
          <CalendarIcon />
          Aanvangsdatum/tijd
        </Button>

        <Button color="zinc" onClick={() => setLeercoachDialogOpen(true)}>
          <UserIcon />
          Leercoach toewijzen
        </Button>

        {canSubmit && (
          <Button color="blue" onClick={() => setSubmitDialogOpen(true)}>
            Indienen ({selectedIds.length})
          </Button>
        )}

        {canCancel && (
          <Button color="red" onClick={() => setCancelDialogOpen(true)}>
            Annuleren ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Start Time Dialog */}
      <Dialog
        open={startTimeDialogOpen}
        onClose={() => setStartTimeDialogOpen(false)}
      >
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
          <Button plain onClick={() => setStartTimeDialogOpen(false)}>
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
      <Dialog
        open={leercoachDialogOpen}
        onClose={() => setLeercoachDialogOpen(false)}
      >
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
          <Button plain onClick={() => setLeercoachDialogOpen(false)}>
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

      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Aanvragen annuleren</DialogTitle>
        <DialogDescription>
          Weet je zeker dat je {selectedIds.length} aanvragen wilt annuleren?
          Deze actie kan niet ongedaan worden gemaakt.
        </DialogDescription>
        <DialogActions>
          <Button plain onClick={() => setCancelDialogOpen(false)}>
            Terug
          </Button>
          <Button color="red" onClick={handleCancel} disabled={isProcessing}>
            Annuleren
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Dialog */}
      <Dialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
      >
        <DialogTitle>Aanvragen indienen</DialogTitle>
        <DialogDescription>
          Je staat op het punt om {selectedIds.length} aanvragen in te dienen.
          Hierna worden de voorwaarden gecontroleerd en kunnen de aanvragen niet
          meer teruggedraaid worden naar concept status.
        </DialogDescription>
        <DialogActions>
          <Button plain onClick={() => setSubmitDialogOpen(false)}>
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
