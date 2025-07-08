"use client";
import { formatters } from "@nawadi/lib";
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
import { useBeoordelaarsForLocation } from "~/app/(dashboard)/_hooks/swr/use-beoordelaars-for-location";
import { usePersonsForLocation } from "~/app/(dashboard)/_hooks/swr/use-persons-for-location";
import {
  cancelPvbsAction,
  grantLeercoachPermissionAction,
  submitPvbsAction,
  updatePvbBeoordelaarAction,
  updatePvbLeercoachAction,
  updatePvbStartTimeAction,
} from "~/app/_actions/pvb/bulk-operations-action";
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
  locationHandle: string;
  onClearSelection: () => void;
}

type DialogType =
  | "startTime"
  | "leercoach"
  | "beoordelaar"
  | "grantLeercoachPermission"
  | "cancel"
  | "submit"
  | null;

export function PvbTableActions({
  selectedPvbs,
  locationId,
  locationHandle,
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
  const { data: instructors } = usePersonsForLocation(locationId, {
    filter: { actorType: "instructor", query: leercoachQuery },
  });

  const { beoordelaars: allBeoordelaars } =
    useBeoordelaarsForLocation(locationId);

  const beoordelaars = allBeoordelaars.filter((beoordelaar) =>
    formatters
      .formatPersonName(beoordelaar)
      .toLowerCase()
      .includes(beoordelaarQuery.toLowerCase()),
  );

  // Calculate what actions are available
  const selectedIds = selectedPvbs.map((pvb) => pvb.id);

  // Check if all selected PVBs have a final status where no actions should be possible
  const finalStatuses = ["afgerond", "ingetrokken", "afgebroken"];
  const someHaveFinalStatus = selectedPvbs.some((pvb) =>
    finalStatuses.includes(pvb.status),
  );

  // Actions are only available if ALL selected PVBs meet the criteria
  const canUpdateStartTime = !someHaveFinalStatus;
  const canUpdateLeercoach =
    !someHaveFinalStatus &&
    selectedPvbs.every(
      (pvb) =>
        pvb.status === "concept" || pvb.status === "wacht_op_voorwaarden",
    );
  const canSubmit =
    !someHaveFinalStatus &&
    selectedPvbs.every((pvb) => pvb.status === "concept");
  const canCancel =
    !someHaveFinalStatus &&
    selectedPvbs.every((pvb) =>
      ["concept", "wacht_op_voorwaarden", "gereed_voor_beoordeling"].includes(
        pvb.status,
      ),
    );
  const canAssignBeoordelaar =
    !someHaveFinalStatus && selectedPvbs.every((pvb) => pvb.type === "intern");
  const canGrantLeercoachPermission =
    !someHaveFinalStatus &&
    selectedPvbs.every(
      (pvb) => pvb.leercoach && pvb.status === "wacht_op_voorwaarden",
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

    // Guard against empty selection
    if (selectedIds.length === 0) {
      toast.error("Selecteer minimaal één aanvraag");
      return;
    }

    // Check if action is allowed
    if (!canUpdateStartTime) {
      toast.error(
        "Deze actie kan niet worden uitgevoerd op aanvragen met een definitieve status",
      );
      return;
    }

    setIsProcessing(true);
    try {
      // Convert datetime-local to ISO string
      const isoDateTime = new Date(startDateTime).toISOString();
      const result = await updatePvbStartTimeAction({
        locationHandle,
        pvbAanvraagIds: selectedIds as [string, ...string[]],
        startDatumTijd: isoDateTime,
      });

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      toast.success(
        `Aanvangsdatum is bijgewerkt voor ${selectedIds.length} aanvragen.`,
      );
      closeDialog();
      onClearSelection();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Er is iets misgegaan bij het bijwerken van de aanvangsdatum.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateLeercoach = async () => {
    if (!selectedLeercoach) return;

    // Guard against empty selection
    if (selectedIds.length === 0) {
      toast.error("Selecteer minimaal één aanvraag");
      return;
    }

    // Check if action is allowed
    if (!canUpdateLeercoach) {
      toast.error(
        "Deze actie kan niet worden uitgevoerd op aanvragen met een definitieve status",
      );
      return;
    }

    setIsProcessing(true);
    try {
      const result = await updatePvbLeercoachAction({
        locationHandle,
        pvbAanvraagIds: selectedIds as [string, ...string[]],
        leercoachId: selectedLeercoach.id,
      });

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      toast.success(
        `${formatters.formatPersonName(selectedLeercoach)} is toegewezen aan ${selectedIds.length} aanvragen.`,
      );
      closeDialog();
      onClearSelection();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Er is iets misgegaan bij het toewijzen van de leercoach.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateBeoordelaar = async () => {
    if (!selectedBeoordelaar) return;

    // Guard against empty selection
    if (selectedIds.length === 0) {
      toast.error("Selecteer minimaal één aanvraag");
      return;
    }

    // Check if action is allowed
    if (!canAssignBeoordelaar) {
      toast.error(
        "Deze actie kan alleen worden uitgevoerd op interne aanvragen zonder definitieve status",
      );
      return;
    }

    setIsProcessing(true);
    try {
      const result = await updatePvbBeoordelaarAction({
        locationHandle,
        pvbAanvraagIds: selectedIds as [string, ...string[]],
        beoordelaarId: selectedBeoordelaar.id,
      });

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      toast.success(
        `${formatters.formatPersonName(selectedBeoordelaar)} is toegewezen aan ${selectedIds.length} aanvragen.`,
      );
      closeDialog();
      onClearSelection();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Er is iets misgegaan bij het toewijzen van de beoordelaar.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    // Guard against empty selection
    if (selectedIds.length === 0) {
      toast.error("Selecteer minimaal één aanvraag");
      return;
    }

    // Check if action is allowed
    if (!canCancel) {
      toast.error(
        "Alleen aanvragen in concept, wacht op voorwaarden of gereed voor beoordeling status kunnen worden geannuleerd",
      );
      return;
    }

    setIsProcessing(true);
    try {
      const result = await cancelPvbsAction({
        locationHandle,
        pvbAanvraagIds: selectedIds as [string, ...string[]],
      });

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      toast.success(`${selectedIds.length} aanvragen zijn geannuleerd.`);
      closeDialog();
      onClearSelection();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Er is iets misgegaan bij het annuleren van de aanvragen.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    // Guard against empty selection
    if (selectedIds.length === 0) {
      toast.error("Selecteer minimaal één aanvraag");
      return;
    }

    // Check if action is allowed
    if (!canSubmit) {
      toast.error("Alleen aanvragen in concept status kunnen worden ingediend");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await submitPvbsAction({
        locationHandle,
        pvbAanvraagIds: selectedIds as [string, ...string[]],
      });

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      toast.success(`${selectedIds.length} aanvragen zijn ingediend.`);
      closeDialog();
      onClearSelection();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Er is iets misgegaan bij het indienen van de aanvragen.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGrantLeercoachPermission = async () => {
    // Guard against empty selection
    if (selectedIds.length === 0) {
      toast.error("Selecteer minimaal één aanvraag");
      return;
    }

    // Check if action is allowed
    if (!canGrantLeercoachPermission) {
      toast.error(
        "Deze actie kan alleen worden uitgevoerd op aanvragen met een leercoach in wacht op voorwaarden status",
      );
      return;
    }

    setIsProcessing(true);
    try {
      const result = await grantLeercoachPermissionAction({
        locationHandle,
        pvbAanvraagIds: selectedIds as [string, ...string[]],
      });

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      toast.success(
        `Leercoach toestemming is gegeven voor ${selectedIds.length} aanvragen.`,
      );
      closeDialog();
      onClearSelection();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Er is iets misgegaan bij het geven van leercoach toestemming.",
      );
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
          <DropdownItem
            onClick={() => setActiveDialog("startTime")}
            disabled={!canUpdateStartTime}
          >
            Aanvangsdatum/tijd aanpassen
          </DropdownItem>

          <DropdownItem
            onClick={() => setActiveDialog("leercoach")}
            disabled={!canUpdateLeercoach}
          >
            Leercoach toewijzen
          </DropdownItem>

          <DropdownItem
            onClick={() => setActiveDialog("grantLeercoachPermission")}
            disabled={!canGrantLeercoachPermission}
          >
            Toestemming namens leercoach geven
          </DropdownItem>

          <DropdownItem
            onClick={() => setActiveDialog("beoordelaar")}
            disabled={!canAssignBeoordelaar}
          >
            Beoordelaar toewijzen
          </DropdownItem>

          <hr className="my-1" />

          <DropdownItem
            onClick={() => setActiveDialog("submit")}
            disabled={!canSubmit}
          >
            Aanvragen indienen ({selectedIds.length})
          </DropdownItem>

          <DropdownItem
            onClick={() => setActiveDialog("cancel")}
            disabled={!canCancel}
          >
            Aanvragen intrekken ({selectedIds.length})
          </DropdownItem>
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
                person ? formatters.formatPersonName(person as Person) : ""
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
                        {formatters.formatPersonName(person)}
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
              options={beoordelaars}
              value={selectedBeoordelaar}
              onChange={setSelectedBeoordelaar}
              displayValue={(person) =>
                person ? formatters.formatPersonName(person as Person) : ""
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
                        {formatters.formatPersonName(person)}
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
          {beoordelaars.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
              <div className="text-sm font-medium text-amber-900">
                Er zijn geen beoordelaars gevonden op deze locatie
              </div>
              <div className="text-xs text-amber-700 mt-1">
                Beoordelaars zijn personen die de rol 'instructeur' hebben
                binnen de locatie én minimaal het kwalificatieprofiel
                'Beoordelaar-4' hebben afgerond.
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

      {/* Grant Leercoach Permission Dialog */}
      <Dialog
        open={activeDialog === "grantLeercoachPermission"}
        onClose={closeDialog}
      >
        <DialogTitle>Leercoach toestemming geven</DialogTitle>
        <DialogDescription>
          Je staat op het punt om namens de leercoach toestemming te geven voor{" "}
          {selectedIds.length} aanvragen. Dit betekent dat je als
          locatiebeheerder handelt namens de leercoach. Deze actie kan alleen
          uitgevoerd worden voor aanvragen waar reeds een leercoach is
          toegewezen, welke zelf nog geen reactie heeft gegeven.
        </DialogDescription>
        <DialogActions>
          <Button plain onClick={closeDialog}>
            Terug
          </Button>
          <Button
            color="blue"
            onClick={handleGrantLeercoachPermission}
            disabled={isProcessing}
          >
            Toestemming geven
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
