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
  createBeoordelingscriterium,
  updateBeoordelingscriterium,
} from "~/app/_actions/kss/kwalificatieprofiel";

interface BeoordelingscriteriumModalProps {
  isOpen: boolean;
  onClose: () => void;
  werkprocesId: string;
  beoordelingscriterium?: {
    id: string;
    title: string;
    omschrijving: string;
    rang: number;
  };
}

export function BeoordelingscriteriumModal({
  isOpen,
  onClose,
  werkprocesId,
  beoordelingscriterium,
}: BeoordelingscriteriumModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: beoordelingscriterium?.title || "",
    omschrijving: beoordelingscriterium?.omschrijving || "",
    rang: beoordelingscriterium?.rang || 1,
  });

  // Update form data when beoordelingscriterium prop changes
  useEffect(() => {
    setFormData({
      title: beoordelingscriterium?.title || "",
      omschrijving: beoordelingscriterium?.omschrijving || "",
      rang: beoordelingscriterium?.rang || 1,
    });
  }, [beoordelingscriterium]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (beoordelingscriterium) {
        await updateBeoordelingscriterium({
          id: beoordelingscriterium.id,
          ...formData,
        });
        toast.success("Beoordelingscriterium bijgewerkt");
      } else {
        await createBeoordelingscriterium({
          werkprocesId,
          ...formData,
        });
        toast.success("Beoordelingscriterium toegevoegd");
      }
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(
        beoordelingscriterium
          ? "Fout bij bijwerken beoordelingscriterium"
          : "Fout bij toevoegen beoordelingscriterium",
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
              {beoordelingscriterium
                ? "Beoordelingscriterium bewerken"
                : "Beoordelingscriterium toevoegen"}
            </h2>
            <Text className="text-sm mt-1">
              {beoordelingscriterium
                ? "Wijzig de gegevens van het beoordelingscriterium"
                : "Voeg een nieuw beoordelingscriterium toe aan dit werkproces"}
            </Text>
          </div>

          <Field>
            <Label>Titel</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              placeholder="Titel van het beoordelingscriterium"
            />
          </Field>

          <Field>
            <Label>Omschrijving</Label>
            <Textarea
              value={formData.omschrijving}
              onChange={(e) =>
                setFormData({ ...formData, omschrijving: e.target.value })
              }
              required
              rows={4}
              placeholder="Beschrijf het beoordelingscriterium"
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
              Bepaalt de volgorde waarin criteria worden getoond
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
                : beoordelingscriterium
                  ? "Bijwerken"
                  : "Toevoegen"}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
