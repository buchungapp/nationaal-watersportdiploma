"use client";

import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  UserIcon,
} from "@heroicons/react/20/solid";
import dayjs from "dayjs";
import { useState } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
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
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          )}
          {title}
        </span>
      </button>
      {isOpen && <div className="mt-2 ml-6">{children}</div>}
    </div>
  );
}

interface Toetsdocumenten {
  kwalificatieprofiel: {
    titel: string;
    richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
    niveau: { rang: number };
  };
  kerntaken: Array<{
    id: string;
    rang?: number | null;
    titel: string;
    type: "verplicht" | "facultatief";
    onderdelen: Array<{
      id: string;
      type: "portfolio" | "praktijk";
      pvbOnderdeelId?: string | null;
      behaaldStatus?: "behaald" | "niet_behaald" | "nog_niet_bekend";
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
  }>;
}

interface Aanvraag {
  id: string;
  onderdelen: Array<{
    id: string;
    kerntaakOnderdeelId: string;
    startDatumTijd: string | null;
    uitslag: "behaald" | "niet_behaald" | "nog_niet_bekend";
    beoordelaar: {
      id: string;
      firstName: string | null;
      lastNamePrefix: string | null;
      lastName: string | null;
    } | null;
  }>;
}

export function ToetsdocumentenDisplay({
  toetsdocumenten,
  aanvraag,
}: {
  toetsdocumenten: Toetsdocumenten;
  aanvraag: Aanvraag;
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
    const typeLabels: Record<string, string> = {
      portfolio: "Portfolio",
      praktijk: "Praktijk",
    };
    return typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getBehaaldStatusLabel = (status: string | null | undefined) => {
    switch (status) {
      case "behaald":
        return "Behaald";
      case "niet_behaald":
        return "Niet behaald";
      default:
        return "Nog niet beoordeeld";
    }
  };

  const formatName = (person: {
    firstName: string | null;
    lastNamePrefix: string | null;
    lastName: string | null;
  }) => {
    const parts = [
      person.firstName,
      person.lastNamePrefix,
      person.lastName,
    ].filter(Boolean);
    return parts.join(" ") || "Onbekend";
  };

  // Create a map of kerntaakOnderdeelId to PvB onderdeel data
  const onderdeelDataMap = new Map(
    aanvraag.onderdelen.map((onderdeel) => [
      onderdeel.kerntaakOnderdeelId,
      onderdeel,
    ]),
  );

  return (
    <div className="space-y-6">
      {/* Kwalificatieprofiel Header */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {toetsdocumenten.kwalificatieprofiel.titel}
        </h3>
      </div>

      {/* Kerntaken */}
      <div className="space-y-4">
        {toetsdocumenten.kerntaken.map((kerntaak) => (
          <div
            key={kerntaak.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {kerntaak.titel}
            </h4>

            {/* Toetsvormen/Onderdelen */}
            {kerntaak.onderdelen.length > 0 && (
              <div className="mt-4 space-y-4">
                {kerntaak.onderdelen.map((onderdeel) => {
                  const pvbData = onderdeelDataMap.get(onderdeel.id);
                  const borderColor =
                    onderdeel.type === "portfolio"
                      ? "border-blue-500"
                      : "border-green-500";

                  return (
                    <div
                      key={onderdeel.id}
                      className={`border-l-4 ${borderColor} bg-gray-50 dark:bg-gray-800/50 rounded-r-lg`}
                    >
                      {/* Header section */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <h5 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {formatOnderdeelType(onderdeel.type)}
                          </h5>
                          <Badge
                            color={
                              pvbData?.uitslag === "behaald"
                                ? "green"
                                : pvbData?.uitslag === "niet_behaald"
                                  ? "red"
                                  : "zinc"
                            }
                          >
                            {getBehaaldStatusLabel(pvbData?.uitslag)}
                          </Badge>
                        </div>

                        {/* Metadata section */}
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          {/* Beoordelaar */}
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span>
                              <span className="text-gray-500 dark:text-gray-400">
                                Beoordelaar:
                              </span>{" "}
                              <span className="text-gray-700 dark:text-gray-300">
                                {pvbData?.beoordelaar
                                  ? formatName(pvbData.beoordelaar)
                                  : "Nog niet toegewezen"}
                              </span>
                            </span>
                          </div>

                          {/* Start datum */}
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span>
                              <span className="text-gray-500 dark:text-gray-400">
                                Aanvangstijdstip:
                              </span>{" "}
                              <span className="text-gray-700 dark:text-gray-300">
                                {pvbData?.startDatumTijd
                                  ? dayjs(pvbData.startDatumTijd).format(
                                      "DD-MM-YYYY HH:mm [uur]",
                                    )
                                  : "Nog niet gepland"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Werkprocessen for this onderdeel */}
                      {onderdeel.werkprocessen.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 px-4 pb-4 pt-3">
                          <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Werkprocessen voor{" "}
                            {formatOnderdeelType(onderdeel.type).toLowerCase()}:
                          </h6>
                          <div className="space-y-2">
                            {onderdeel.werkprocessen.map((werkproces) => (
                              <CollapsibleSection
                                key={werkproces.id}
                                title={
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-800 dark:text-gray-200">
                                      {werkproces.titel}
                                    </span>
                                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                                      {werkproces.resultaat}
                                    </Text>
                                  </div>
                                }
                              >
                                {werkproces.beoordelingscriteria.length > 0 && (
                                  <div className="space-y-2">
                                    <h6 className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                      Beoordelingscriteria
                                    </h6>
                                    <ul className="space-y-1">
                                      {werkproces.beoordelingscriteria.map(
                                        (criterium) => (
                                          <li
                                            key={criterium.id}
                                            className="flex items-start gap-2"
                                          >
                                            <DocumentTextIcon className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <Text className="text-xs text-gray-600 dark:text-gray-400">
                                              {criterium.omschrijving}
                                            </Text>
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </CollapsibleSection>
                            ))}
                          </div>
                        </div>
                      )}

                      {onderdeel.werkprocessen.length === 0 && (
                        <div className="px-4 pb-4">
                          <Text className="text-sm text-gray-500 dark:text-gray-400 italic">
                            Geen werkprocessen toegewezen aan dit onderdeel
                          </Text>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
