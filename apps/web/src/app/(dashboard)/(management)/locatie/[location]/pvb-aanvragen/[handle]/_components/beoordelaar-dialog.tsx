"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { usePersonsForLocation } from "~/app/(dashboard)/_hooks/swr/use-persons-for-location";
import { updatePvbBeoordelaarAction } from "../actions";

interface Person {
  id: string;
  firstName: string;
  lastName: string | null;
  lastNamePrefix: string | null;
  email: string | null;
}

export function BeoordelaarDialog({
  open,
  onClose,
  params,
  locatieId,
}: {
  open: boolean;
  onClose: () => void;
  params: Promise<{ location: string; handle: string }>;
  locatieId: string;
}) {
  const [beoordelaarId, setBeoordelaarId] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Fetch beoordelaars for the location
  const { data: persons } = usePersonsForLocation(locatieId, {
    filter: { query, actorType: "pvb_beoordelaar" },
  });

  const beoordelaars = persons?.items || [];
  const selectedBeoordelaar =
    beoordelaars.find((p) => p.id === beoordelaarId) || null;

  const formatPersonName = (person: Person) => {
    const parts = [person.firstName];
    if (person.lastNamePrefix) parts.push(person.lastNamePrefix);
    if (person.lastName) parts.push(person.lastName);
    return parts.join(" ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const resolvedParams = await params;
        await updatePvbBeoordelaarAction(resolvedParams.handle, beoordelaarId);

        router.refresh();
        onClose();
        setBeoordelaarId("");
        setQuery("");
      } catch (error) {
        console.error("Failed to update beoordelaar:", error);
      }
    });
  };

  const handleClose = () => {
    onClose();
    setBeoordelaarId("");
    setQuery("");
  };

  const showEmptyMessage = persons && beoordelaars.length === 0;

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Beoordelaar toewijzen</DialogTitle>
        <DialogBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selecteer een beoordelaar voor alle onderdelen van deze PvB
              aanvraag.
            </p>
            <div>
              <label
                htmlFor="beoordelaar"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Beoordelaar
              </label>
              {showEmptyMessage ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-amber-900">
                    Er zijn geen beoordelaars gevonden op deze locatie
                  </div>
                  <div className="text-xs text-amber-700 mt-1">
                    Beoordelaars worden aangewezen door personen binnen de
                    locatie te voorzien van de 'interne beoordelaar' rol.
                  </div>
                </div>
              ) : (
                <Combobox
                  options={beoordelaars}
                  value={selectedBeoordelaar}
                  onChange={(person) => setBeoordelaarId(person?.id || "")}
                  displayValue={(person) =>
                    person ? formatPersonName(person) : ""
                  }
                  setQuery={setQuery}
                  filter={() => true} // Server-side filtering via query
                  placeholder="Zoek een beoordelaar..."
                >
                  {(person) => (
                    <ComboboxOption key={person.id} value={person}>
                      <ComboboxLabel>
                        <div className="flex">
                          <span className="truncate">
                            {formatPersonName(person)}
                          </span>
                          {person.email && (
                            <span className="ml-2 text-slate-500 truncate">
                              ({person.email})
                            </span>
                          )}
                        </div>
                      </ComboboxLabel>
                    </ComboboxOption>
                  )}
                </Combobox>
              )}
            </div>
          </div>
        </DialogBody>
        <DialogActions>
          <Button
            type="button"
            plain
            onClick={handleClose}
            disabled={isPending}
          >
            Annuleren
          </Button>
          <Button
            type="submit"
            color="branding-orange"
            disabled={isPending || !beoordelaarId || showEmptyMessage}
          >
            {isPending ? "Bezig..." : "Toewijzen"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
