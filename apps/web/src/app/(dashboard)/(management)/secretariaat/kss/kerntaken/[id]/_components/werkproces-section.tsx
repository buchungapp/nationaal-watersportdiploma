"use client";

import {
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  deleteBeoordelingscriterium,
  deleteWerkproces,
} from "~/app/_actions/kss/kwalificatieprofiel";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import { Text } from "~/app/(dashboard)/_components/text";
import { BeoordelingscriteriaBulkModal } from "./beoordelingscriteria-bulk-modal";
import { BeoordelingscriteriumModal } from "./beoordelingscriterium-modal";
import { WerkprocesModal } from "./werkproces-modal";

interface Beoordelingscriterium {
  id: string;
  title: string;
  omschrijving: string;
  rang: number;
}

interface Werkproces {
  id: string;
  titel: string;
  resultaat: string;
  rang: number;
  beoordelingscriteria: Beoordelingscriterium[];
}

interface WerkprocesSectionProps {
  kerntaakId: string;
  werkprocessen: Werkproces[];
}

export default function WerkprocesSection({
  kerntaakId,
  werkprocessen,
}: WerkprocesSectionProps) {
  const router = useRouter();
  const [expandedWerkprocessen, setExpandedWerkprocessen] = useState<
    Set<string>
  >(new Set());

  // Modal states
  const [werkprocesModalOpen, setWerkprocesModalOpen] = useState(false);
  const [criteriumModalOpen, setCriteriumModalOpen] = useState(false);
  const [criteriaBulkModalOpen, setCriteriaBulkModalOpen] = useState(false);
  const [selectedWerkproces, setSelectedWerkproces] = useState<
    Werkproces | undefined
  >();
  const [selectedCriterium, setSelectedCriterium] = useState<
    Beoordelingscriterium | undefined
  >();
  const [selectedWerkprocesId, setSelectedWerkprocesId] = useState<string>("");

  const toggleWerkproces = (werkprocesId: string) => {
    setExpandedWerkprocessen((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(werkprocesId)) {
        newSet.delete(werkprocesId);
      } else {
        newSet.add(werkprocesId);
      }
      return newSet;
    });
  };

  const handleAddWerkproces = () => {
    setSelectedWerkproces(undefined);
    setWerkprocesModalOpen(true);
  };

  const handleEditWerkproces = (werkproces: Werkproces) => {
    setSelectedWerkproces(werkproces);
    setWerkprocesModalOpen(true);
  };

  const handleDeleteWerkproces = async (werkprocesId: string) => {
    if (!confirm("Weet je zeker dat je dit werkproces wilt verwijderen?")) {
      return;
    }

    try {
      await deleteWerkproces({ id: werkprocesId });
      toast.success("Werkproces verwijderd");
      router.refresh();
    } catch (_error) {
      toast.error("Fout bij verwijderen werkproces");
    }
  };

  const _handleAddCriterium = (werkprocesId: string) => {
    setSelectedWerkprocesId(werkprocesId);
    setSelectedCriterium(undefined);
    setCriteriumModalOpen(true);
  };

  const handleEditCriterium = (
    criterium: Beoordelingscriterium,
    werkprocesId: string,
  ) => {
    setSelectedWerkprocesId(werkprocesId);
    setSelectedCriterium(criterium);
    setCriteriumModalOpen(true);
  };

  const handleDeleteCriterium = async (criteriumId: string) => {
    if (
      !confirm(
        "Weet je zeker dat je dit beoordelingscriterium wilt verwijderen?",
      )
    ) {
      return;
    }

    try {
      await deleteBeoordelingscriterium({ id: criteriumId });
      toast.success("Beoordelingscriterium verwijderd");
      router.refresh();
    } catch (_error) {
      toast.error("Fout bij verwijderen beoordelingscriterium");
    }
  };

  // Sort werkprocessen by rang
  const sortedWerkprocessen = [...werkprocessen].sort((a, b) => {
    if (a.rang === null && b.rang === null) return 0;
    if (a.rang === null) return 1;
    if (b.rang === null) return -1;
    return a.rang - b.rang;
  });

  if (werkprocessen.length === 0) {
    return (
      <>
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Text className="text-gray-500 mb-4">
            Er zijn nog geen werkprocessen toegevoegd aan deze kerntaak.
          </Text>
          <Button color="branding-orange" onClick={handleAddWerkproces}>
            <PlusIcon />
            Eerste werkproces toevoegen
          </Button>
        </div>

        <WerkprocesModal
          isOpen={werkprocesModalOpen}
          onClose={() => setWerkprocesModalOpen(false)}
          kerntaakId={kerntaakId}
          werkproces={selectedWerkproces}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {sortedWerkprocessen.map((werkproces) => {
          const isExpanded = expandedWerkprocessen.has(werkproces.id);
          const sortedCriteria = [...werkproces.beoordelingscriteria].sort(
            (a, b) => a.rang - b.rang,
          );

          return (
            <div
              key={werkproces.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <div className="bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => toggleWerkproces(werkproces.id)}
                      className="flex items-start gap-2 text-left w-full group"
                    >
                      <div className="mt-1">
                        {isExpanded ? (
                          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-gray-700">
                          {werkproces.titel}
                        </h4>
                        <Text className="text-sm mt-1">
                          {werkproces.resultaat}
                        </Text>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge color="zinc" className="text-xs">
                            Rang: {werkproces.rang}
                          </Badge>
                          <Badge color="blue" className="text-xs">
                            {werkproces.beoordelingscriteria.length} criteria
                          </Badge>
                        </div>
                      </div>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      plain
                      onClick={() => handleEditWerkproces(werkproces)}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      plain
                      onClick={() => handleDeleteWerkproces(werkproces.id)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 ml-6">
                    <Divider />
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-gray-900">
                          Beoordelingscriteria
                        </h5>
                        <Dropdown>
                          <DropdownButton
                            color="branding-orange"
                            className="!px-2 !py-1 text-xs"
                          >
                            <PlusIcon />
                            Criteria toevoegen
                          </DropdownButton>
                          <DropdownMenu>
                            <DropdownItem
                              onClick={() => {
                                setSelectedWerkprocesId(werkproces.id);
                                setSelectedCriterium(undefined);
                                setCriteriumModalOpen(true);
                              }}
                            >
                              Enkel criterium
                            </DropdownItem>
                            <DropdownItem
                              onClick={() => {
                                setSelectedWerkprocesId(werkproces.id);
                                setCriteriaBulkModalOpen(true);
                              }}
                            >
                              Meerdere criteria
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>

                      {sortedCriteria.length === 0 ? (
                        <Text className="text-sm text-gray-500 italic">
                          Geen beoordelingscriteria toegevoegd
                        </Text>
                      ) : (
                        <div className="space-y-2">
                          {sortedCriteria.map((criterium) => (
                            <div
                              key={criterium.id}
                              className="flex items-start justify-between p-3 bg-gray-50 rounded-md"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-900">
                                  {criterium.title}
                                </div>
                                <Text className="text-sm mt-1">
                                  {criterium.omschrijving}
                                </Text>
                                <Badge color="zinc" className="text-xs mt-1">
                                  Rang: {criterium.rang}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 ml-4">
                                <Button
                                  plain
                                  className="!p-1"
                                  onClick={() =>
                                    handleEditCriterium(
                                      criterium,
                                      werkproces.id,
                                    )
                                  }
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  plain
                                  className="!p-1"
                                  onClick={() =>
                                    handleDeleteCriterium(criterium.id)
                                  }
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <WerkprocesModal
        isOpen={werkprocesModalOpen}
        onClose={() => setWerkprocesModalOpen(false)}
        kerntaakId={kerntaakId}
        werkproces={selectedWerkproces}
      />

      <BeoordelingscriteriumModal
        isOpen={criteriumModalOpen}
        onClose={() => setCriteriumModalOpen(false)}
        werkprocesId={selectedWerkprocesId}
        beoordelingscriterium={selectedCriterium}
      />

      <BeoordelingscriteriaBulkModal
        isOpen={criteriaBulkModalOpen}
        onClose={() => setCriteriaBulkModalOpen(false)}
        werkprocesId={selectedWerkprocesId}
      />
    </>
  );
}
