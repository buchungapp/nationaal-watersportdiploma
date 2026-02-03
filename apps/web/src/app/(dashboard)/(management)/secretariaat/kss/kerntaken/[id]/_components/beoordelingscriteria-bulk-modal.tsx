"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { bulkCreateBeoordelingscriteria } from "~/app/_actions/kss/kwalificatieprofiel";
import { Button } from "~/app/(dashboard)/_components/button";
import { Dialog } from "~/app/(dashboard)/_components/dialog";
import { Field, Label } from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { Text } from "~/app/(dashboard)/_components/text";
import { Textarea } from "~/app/(dashboard)/_components/textarea";

interface BeoordelingscriteriumInput {
  id: string;
  title: string;
  omschrijving: string;
  rang: number;
}

interface BeoordelingscriteriaBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  werkprocesId: string;
}

export function BeoordelingscriteriaBulkModal({
  isOpen,
  onClose,
  werkprocesId,
}: BeoordelingscriteriaBulkModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [criteria, setCriteria] = useState<BeoordelingscriteriumInput[]>([
    { id: crypto.randomUUID(), title: "", omschrijving: "", rang: 1 },
  ]);

  const handleAddCriterium = () => {
    const lastRang = criteria[criteria.length - 1]?.rang || 0;
    setCriteria([
      ...criteria,
      {
        id: crypto.randomUUID(),
        title: "",
        omschrijving: "",
        rang: lastRang + 1,
      },
    ]);
  };

  const handleRemoveCriterium = (id: string) => {
    if (criteria.length > 1) {
      setCriteria(criteria.filter((c) => c.id !== id));
    }
  };

  const handleCriteriumChange = (
    id: string,
    field: keyof Omit<BeoordelingscriteriumInput, "id">,
    value: string | number,
  ) => {
    const updatedCriteria = criteria.map((c) =>
      c.id === id
        ? { ...c, [field]: field === "rang" ? Number(value) : value }
        : c,
    );
    setCriteria(updatedCriteria);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate all criteria have required fields
      const validCriteria = criteria
        .filter((c) => c.title && c.omschrijving && c.rang > 0)
        .map(({ title, omschrijving, rang }) => ({
          title,
          omschrijving,
          rang,
        }));

      if (validCriteria.length === 0) {
        toast.error("Voeg minimaal één volledig criterium toe");
        setIsSubmitting(false);
        return;
      }

      await bulkCreateBeoordelingscriteria({
        werkprocesId,
        criteria: validCriteria,
      });

      toast.success(`${validCriteria.length} beoordelingscriteria toegevoegd`);
      onClose();
      router.refresh();
    } catch (_error) {
      toast.error("Fout bij toevoegen beoordelingscriteria");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCriteria([
      { id: crypto.randomUUID(), title: "", omschrijving: "", rang: 1 },
    ]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} size="xl">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              Beoordelingscriteria in bulk toevoegen
            </h2>
            <Text className="text-sm mt-1">
              Voeg meerdere beoordelingscriteria tegelijk toe aan dit werkproces
            </Text>
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
            {criteria.map((criterium, index) => (
              <div
                key={criterium.id}
                className="border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <Text className="font-medium">Criterium {index + 1}</Text>
                  {criteria.length > 1 && (
                    <Button
                      type="button"
                      plain
                      onClick={() => handleRemoveCriterium(criterium.id)}
                    >
                      <MinusIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <Field>
                  <Label>Titel</Label>
                  <Input
                    value={criterium.title}
                    onChange={(e) =>
                      handleCriteriumChange(
                        criterium.id,
                        "title",
                        e.target.value,
                      )
                    }
                    required
                    placeholder="Titel van het beoordelingscriterium"
                  />
                </Field>

                <Field>
                  <Label>Omschrijving</Label>
                  <Textarea
                    value={criterium.omschrijving}
                    onChange={(e) =>
                      handleCriteriumChange(
                        criterium.id,
                        "omschrijving",
                        e.target.value,
                      )
                    }
                    required
                    rows={3}
                    placeholder="Beschrijf het beoordelingscriterium"
                  />
                </Field>

                <Field>
                  <Label>Rang</Label>
                  <Input
                    type="number"
                    value={criterium.rang}
                    onChange={(e) =>
                      handleCriteriumChange(
                        criterium.id,
                        "rang",
                        e.target.value,
                      )
                    }
                    required
                    min={1}
                    className="w-24"
                  />
                </Field>
              </div>
            ))}
          </div>

          <Button
            type="button"
            plain
            onClick={handleAddCriterium}
            className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400"
          >
            <PlusIcon className="h-4 w-4" />
            Criterium toevoegen
          </Button>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" plain onClick={handleClose}>
              Annuleren
            </Button>
            <Button
              type="submit"
              color="branding-orange"
              disabled={isSubmitting || criteria.every((c) => !c.title)}
            >
              {isSubmitting
                ? "Bezig..."
                : `${criteria.filter((c) => c.title && c.omschrijving).length} criteria toevoegen`}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
