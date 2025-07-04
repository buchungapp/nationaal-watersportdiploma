"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import { Dialog } from "~/app/(dashboard)/_components/dialog";
import { Field, Label } from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { Text } from "~/app/(dashboard)/_components/text";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import {
  createWerkproces,
  updateWerkproces,
} from "~/app/_actions/kss/kwalificatieprofiel";

interface WerkprocesModalProps {
  isOpen: boolean;
  onClose: () => void;
  kerntaakId: string;
  werkproces?: {
    id: string;
    titel: string;
    resultaat: string;
    rang: number;
  };
}

export function WerkprocesModal({
  isOpen,
  onClose,
  kerntaakId,
  werkproces,
}: WerkprocesModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titel: werkproces?.titel || "",
    resultaat: werkproces?.resultaat || "",
    rang: werkproces?.rang || 1,
  });

  // Update form data when werkproces prop changes
  useEffect(() => {
    setFormData({
      titel: werkproces?.titel || "",
      resultaat: werkproces?.resultaat || "",
      rang: werkproces?.rang || 1,
    });
  }, [werkproces]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (werkproces) {
        await updateWerkproces({
          id: werkproces.id,
          ...formData,
        });
        toast.success("Werkproces bijgewerkt");
      } else {
        await createWerkproces({
          kerntaakId,
          ...formData,
        });
        toast.success("Werkproces toegevoegd");
      }
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(
        werkproces
          ? "Fout bij bijwerken werkproces"
          : "Fout bij toevoegen werkproces",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              {werkproces ? "Werkproces bewerken" : "Werkproces toevoegen"}
            </h2>
            <Text className="text-sm mt-1">
              {werkproces
                ? "Wijzig de gegevens van het werkproces"
                : "Voeg een nieuw werkproces toe aan deze kerntaak"}
            </Text>
          </div>

          <Field>
            <Label>Titel</Label>
            <Input
              type="text"
              value={formData.titel}
              onChange={(e) =>
                setFormData({ ...formData, titel: e.target.value })
              }
              required
              placeholder="Bijv. Voorbereiden van de les"
            />
          </Field>

          <Field>
            <Label>Resultaat</Label>
            <Textarea
              value={formData.resultaat}
              onChange={(e) =>
                setFormData({ ...formData, resultaat: e.target.value })
              }
              required
              rows={3}
              placeholder="Beschrijf het verwachte resultaat van dit werkproces"
            />
          </Field>

          <Field>
            <Label>Rang</Label>
            <Input
              type="number"
              value={formData.rang}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rang: Number.parseInt(e.target.value) || 1,
                })
              }
              required
              min={1}
            />
            <Text className="text-xs mt-1">
              Bepaalt de volgorde waarin werkprocessen worden getoond
            </Text>
          </Field>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" plain onClick={onClose}>
              Annuleren
            </Button>
            <Button
              type="submit"
              color="branding-orange"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Bezig..."
                : werkproces
                  ? "Bijwerken"
                  : "Toevoegen"}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
