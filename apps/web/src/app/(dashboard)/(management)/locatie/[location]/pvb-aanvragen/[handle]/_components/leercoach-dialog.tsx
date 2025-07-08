"use client";

import { formatters } from "@nawadi/lib";
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
import { updatePvbLeercoachAction } from "~/app/_actions/pvb/single-operations-action";

interface Person {
  id: string;
  firstName: string;
  lastName: string | null;
  lastNamePrefix: string | null;
  email: string | null;
}

export function LeercoachDialog({
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
  const [leercoachId, setLeercoachId] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Fetch instructors for the location
  const { data: persons } = usePersonsForLocation(locatieId, {
    filter: { query, actorType: "instructor" },
  });

  const instructors = persons?.items || [];
  const selectedInstructor =
    instructors.find((p) => p.id === leercoachId) || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const resolvedParams = await params;
        await updatePvbLeercoachAction({
          locationHandle: resolvedParams.location,
          handle: resolvedParams.handle,
          leercoachId,
        });

        router.refresh();
        onClose();
        setLeercoachId("");
        setQuery("");
      } catch (error) {
        console.error("Failed to update leercoach:", error);
      }
    });
  };

  const handleClose = () => {
    onClose();
    setLeercoachId("");
    setQuery("");
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Leercoach toewijzen</DialogTitle>
        <DialogBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selecteer een leercoach voor deze PvB aanvraag.
            </p>
            <div>
              <label
                htmlFor="leercoach"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Leercoach
              </label>
              <Combobox
                options={instructors}
                value={selectedInstructor}
                onChange={(person) => setLeercoachId(person?.id || "")}
                displayValue={(person) =>
                  person ? formatters.formatPersonName(person) : ""
                }
                setQuery={setQuery}
                filter={() => true} // Server-side filtering via query
                placeholder="Zoek een instructeur..."
              >
                {(person) => (
                  <ComboboxOption key={person.id} value={person}>
                    <ComboboxLabel>
                      <div className="flex">
                        <span className="truncate">
                          {formatters.formatPersonName(person)}
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
            disabled={isPending || !leercoachId}
          >
            {isPending ? "Bezig..." : "Toewijzen"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
