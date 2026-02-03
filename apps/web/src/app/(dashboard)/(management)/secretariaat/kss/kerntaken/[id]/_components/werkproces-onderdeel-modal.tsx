"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  assignWerkprocessenToOnderdeel,
  listWerkprocessenByOnderdeel,
} from "~/app/_actions/kss/kwalificatieprofiel";
import { Button } from "~/app/(dashboard)/_components/button";
import { Checkbox } from "~/app/(dashboard)/_components/checkbox";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";

interface WerkprocesOnderdeelModalProps {
  isOpen: boolean;
  onClose: () => void;
  kerntaakId: string;
  onderdelen: Array<{
    id: string;
    type: "portfolio" | "praktijk";
  }>;
  werkprocessen: Array<{
    id: string;
    titel: string;
    resultaat: string;
    rang: number;
  }>;
}

export function WerkprocesOnderdeelModal({
  isOpen,
  onClose,
  kerntaakId,
  onderdelen,
  werkprocessen,
}: WerkprocesOnderdeelModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, Set<string>>>(
    {},
  );
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  const loadCurrentAssignments = useCallback(async () => {
    setLoadingAssignments(true);
    const newAssignments: Record<string, Set<string>> = {};

    try {
      for (const onderdeel of onderdelen) {
        const result = await listWerkprocessenByOnderdeel({
          kerntaakOnderdeelId: onderdeel.id,
        });

        // The result is wrapped in a data property by the safe-action library
        if (result && "data" in result && Array.isArray(result.data)) {
          newAssignments[onderdeel.id] = new Set(result.data.map((w) => w.id));
        } else {
          // If we get an unexpected result, assume no assignments
          newAssignments[onderdeel.id] = new Set();
        }
      }
      setAssignments(newAssignments);
    } catch (error) {
      // Initialize with empty assignments if there's an error
      for (const onderdeel of onderdelen) {
        newAssignments[onderdeel.id] = new Set();
      }
      setAssignments(newAssignments);

      // Show a more informative error message
      toast.error("Kon toewijzingen niet ophalen", {
        description: error instanceof Error ? error.message : "Onbekende fout",
      });
    } finally {
      setLoadingAssignments(false);
    }
  }, [onderdelen]);

  // Load current assignments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCurrentAssignments();
    }
  }, [isOpen, loadCurrentAssignments]);

  const toggleWerkproces = (onderdeelId: string, werkprocesId: string) => {
    setAssignments((prev) => {
      const newAssignments = { ...prev };
      if (!newAssignments[onderdeelId]) {
        newAssignments[onderdeelId] = new Set();
      } else {
        // Create a new Set to trigger re-render
        newAssignments[onderdeelId] = new Set(newAssignments[onderdeelId]);
      }

      if (newAssignments[onderdeelId].has(werkprocesId)) {
        newAssignments[onderdeelId].delete(werkprocesId);
      } else {
        newAssignments[onderdeelId].add(werkprocesId);
      }

      return newAssignments;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Update assignments for each onderdeel
      for (const onderdeel of onderdelen) {
        const werkprocesIds = Array.from(
          assignments[onderdeel.id] || new Set<string>(),
        );
        await assignWerkprocessenToOnderdeel({
          kerntaakOnderdeelId: onderdeel.id,
          werkprocesIds,
        });
      }

      toast.success("Werkprocessen succesvol toegewezen");
      router.refresh();
      onClose();
    } catch (_error) {
      toast.error("Fout bij toewijzen werkprocessen");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatOnderdeelType = (type: string) => {
    return type === "portfolio" ? "Portfolio" : "Praktijk";
  };

  // Sort werkprocessen by rang
  const sortedWerkprocessen = [...werkprocessen].sort(
    (a, b) => a.rang - b.rang,
  );

  return (
    <Dialog open={isOpen} onClose={onClose} size="5xl">
      <DialogTitle>Werkprocessen toewijzen aan onderdelen</DialogTitle>
      <DialogDescription>
        Selecteer welke werkprocessen bij welke onderdelen (portfolio/praktijk)
        getoetst moeten worden.
      </DialogDescription>
      <DialogBody>
        {loadingAssignments ? (
          <Text>Laden...</Text>
        ) : (
          <div className="space-y-6">
            {onderdelen.map((onderdeel) => (
              <div key={onderdeel.id} className="border rounded-lg p-4">
                <Heading level={3} className="mb-4">
                  {formatOnderdeelType(onderdeel.type)}
                </Heading>
                <div className="space-y-2">
                  {sortedWerkprocessen.map((werkproces) => (
                    <div
                      key={werkproces.id}
                      className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded"
                    >
                      <Checkbox
                        id={`${onderdeel.id}-${werkproces.id}`}
                        checked={
                          assignments[onderdeel.id]?.has(werkproces.id) || false
                        }
                        onChange={() =>
                          toggleWerkproces(onderdeel.id, werkproces.id)
                        }
                      />
                      <label
                        htmlFor={`${onderdeel.id}-${werkproces.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <Text className="font-medium">{werkproces.titel}</Text>
                        <Text className="text-sm text-gray-600">
                          {werkproces.resultaat}
                        </Text>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogBody>
      <DialogActions>
        <Button plain onClick={onClose} disabled={isSubmitting}>
          Annuleren
        </Button>
        <Button
          color="branding-orange"
          onClick={handleSubmit}
          disabled={isSubmitting || loadingAssignments}
        >
          {isSubmitting ? "Bezig..." : "Toewijzen"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
