"use client";

import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/20/solid";
import { useState } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Text } from "~/app/(dashboard)/_components/text";

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none"
      >
        <span className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          )}
          {title}
        </span>
      </button>
      {isOpen && <div className="mt-2 ml-7">{children}</div>}
    </div>
  );
}

interface Toetsdocumenten {
  kwalificatieprofiel: {
    titel: string;
    richting: string;
    niveau: { rang: number };
  };
  kerntaken: Array<{
    id: string;
    rang?: number | null;
    titel: string;
    type: "verplicht" | "facultatief";
    onderdelen: Array<{
      id: string;
      type: string;
      pvbOnderdeelId?: string | null;
      behaaldStatus?: string | null;
    }>;
    werkprocessen: Array<{
      id: string;
      rang: number;
      titel: string;
      resultaat: string;
      beoordelingscriteria: Array<{
        id: string;
        rang: number | null;
        omschrijving: string | null;
      }>;
    }>;
  }>;
}

export function ToetsdocumentenDisplay({
  toetsdocumenten,
}: {
  toetsdocumenten: Toetsdocumenten;
}) {
  const formatRichting = (richting: string) => {
    const richtingLabels: Record<string, string> = {
      instructeur: "Instructeur",
      leercoach: "Leercoach",
      pvb_beoordelaar: "PvB Beoordelaar",
    };
    return richtingLabels[richting] || richting;
  };

  const formatOnderdeelType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getBehaaldStatusBadge = (status: string) => {
    switch (status) {
      case "behaald":
        return <Badge color="green">Behaald</Badge>;
      case "niet_behaald":
        return <Badge color="red">Niet behaald</Badge>;
      default:
        return <Badge color="zinc">Nog niet bekend</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Kwalificatieprofiel Header */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {toetsdocumenten.kwalificatieprofiel.titel}
        </h3>
        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>
            Richting:{" "}
            {formatRichting(toetsdocumenten.kwalificatieprofiel.richting)}
          </span>
          <span>Niveau: {toetsdocumenten.kwalificatieprofiel.niveau.rang}</span>
        </div>
      </div>

      <Divider />

      {/* Kerntaken */}
      <div className="space-y-4">
        {toetsdocumenten.kerntaken.map((kerntaak) => (
          <div
            key={kerntaak.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {kerntaak.rang ? `${kerntaak.rang}. ` : ""}
                  {kerntaak.titel}
                </h4>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    color={kerntaak.type === "verplicht" ? "blue" : "zinc"}
                  >
                    {kerntaak.type === "verplicht"
                      ? "Verplicht"
                      : "Facultatief"}
                  </Badge>
                  {kerntaak.onderdelen.map((onderdeel) => (
                    <div key={onderdeel.id} className="flex items-center gap-2">
                      <Badge color="zinc">
                        {formatOnderdeelType(onderdeel.type)}
                      </Badge>
                      {onderdeel.pvbOnderdeelId &&
                        onderdeel.behaaldStatus &&
                        getBehaaldStatusBadge(onderdeel.behaaldStatus)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Werkprocessen */}
            {kerntaak.werkprocessen.length > 0 && (
              <div className="mt-4 space-y-3">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Werkprocessen
                </h5>
                {kerntaak.werkprocessen.map((werkproces) => (
                  <CollapsibleSection
                    key={werkproces.id}
                    title={
                      <div className="text-sm">
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {werkproces.rang}. {werkproces.titel}
                        </span>
                        <Text className="mt-0.5 text-gray-600 dark:text-gray-400">
                          {werkproces.resultaat}
                        </Text>
                      </div>
                    }
                  >
                    {werkproces.beoordelingscriteria.length > 0 && (
                      <div className="space-y-2">
                        <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Beoordelingscriteria
                        </h6>
                        <ul className="space-y-1">
                          {werkproces.beoordelingscriteria.map((criterium) => (
                            <li
                              key={criterium.id}
                              className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400"
                            >
                              <DocumentTextIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span>
                                {criterium.rang}. {criterium.omschrijving}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CollapsibleSection>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
