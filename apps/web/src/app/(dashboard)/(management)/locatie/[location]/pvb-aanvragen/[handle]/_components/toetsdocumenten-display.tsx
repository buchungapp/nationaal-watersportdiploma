"use client";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { CalendarIcon, UserIcon } from "@heroicons/react/20/solid";
import dayjs from "dayjs";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Checkbox } from "~/app/(dashboard)/_components/checkbox";
import { CursussenPerKwalificatieprofiel } from "./cursussen-per-kwalificatieprofiel";

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
          title: string;
          omschrijving: string | null;
        }>;
      }>;
    }>;
  }>;
}

interface Course {
  id: string;
  title: string | null;
  code: string | null;
  isMainCourse: boolean;
}

interface Aanvraag {
  id: string;
  status: string;
  courses: Course[];
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
  params,
}: {
  toetsdocumenten: Toetsdocumenten;
  aanvraag: Aanvraag;
  params: { location: string; handle: string };
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

      {/* Cursussen Section */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Cursussen
          </h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Beheer de cursussen voor dit kwalificatieprofiel. Er moet altijd een
            hoofdcursus ingesteld zijn.
          </p>
        </div>
        <div className="p-4">
          <CursussenPerKwalificatieprofiel
            pvbAanvraagId={aanvraag.id}
            locationHandle={params.location}
            existingCourses={aanvraag.courses}
            status={aanvraag.status}
            richting={toetsdocumenten.kwalificatieprofiel.richting}
          />
        </div>
      </div>

      {/* Kerntaken */}
      <div className="space-y-4">
        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Toetsdocumenten
        </h4>

        {toetsdocumenten.kerntaken.map((kerntaak) => (
          <div
            key={kerntaak.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <div className="p-4">
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {kerntaak.titel}
              </h4>
            </div>

            {/* Toetsvormen/Onderdelen */}
            {kerntaak.onderdelen.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                {kerntaak.onderdelen.map((onderdeel) => {
                  const pvbData = onderdeelDataMap.get(onderdeel.id);
                  const borderColor =
                    onderdeel.type === "portfolio"
                      ? "border-blue-500"
                      : "border-green-500";

                  return (
                    <div
                      key={onderdeel.id}
                      className={`border-l-4 ${borderColor}`}
                    >
                      {/* Header section */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-4">
                        <div className="flex items-start justify-between gap-4 mb-3">
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
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
                          {/* Beoordelaar */}
                          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-500 dark:text-gray-400">
                              Beoordelaar:
                            </span>
                            <span className="font-medium">
                              {pvbData?.beoordelaar
                                ? formatName(pvbData.beoordelaar)
                                : "Nog niet toegewezen"}
                            </span>
                          </div>

                          {/* Start datum */}
                          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                            <CalendarIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-500 dark:text-gray-400">
                              Aanvangstijdstip:
                            </span>
                            <span className="font-medium">
                              {pvbData?.startDatumTijd
                                ? dayjs(pvbData.startDatumTijd).format(
                                    "DD-MM-YYYY HH:mm [uur]",
                                  )
                                : "Nog niet gepland"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Werkprocessen for this onderdeel */}
                      {onderdeel.werkprocessen.length > 0 && (
                        <div className="bg-white dark:bg-gray-900">
                          <h6 className="px-4 pt-3 pb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Werkprocessen:
                          </h6>
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {onderdeel.werkprocessen.map((werkproces) => (
                              <Disclosure
                                key={werkproces.id}
                                defaultOpen={false}
                              >
                                {({ open }) => (
                                  <div>
                                    <DisclosureButton className="flex w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                      <div className="flex items-start gap-3 flex-1">
                                        <div className="mt-0.5">
                                          {open ? (
                                            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                                          ) : (
                                            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                                          )}
                                        </div>
                                        <div className="mt-1">
                                          <Checkbox
                                            checked={false}
                                            disabled
                                            className="pointer-events-none"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-baseline gap-2">
                                            <h6 className="font-medium text-gray-900 dark:text-gray-100">
                                              {werkproces.titel}
                                            </h6>
                                          </div>
                                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 text-justify">
                                            {werkproces.resultaat}
                                          </p>
                                        </div>
                                      </div>
                                    </DisclosureButton>

                                    <DisclosurePanel className="pr-4 pl-8 pb-3">
                                      {werkproces.beoordelingscriteria.length >
                                        0 && (
                                        <div className="ml-11 mt-2 space-y-2">
                                          <h6 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                            Beoordelingscriteria
                                          </h6>
                                          <div className="space-y-2">
                                            {werkproces.beoordelingscriteria.map(
                                              (criterium) => (
                                                <div
                                                  key={criterium.id}
                                                  className="flex items-start gap-3"
                                                >
                                                  <div className="mt-0.5">
                                                    <Checkbox
                                                      checked={false}
                                                      disabled
                                                      className="pointer-events-none"
                                                    />
                                                  </div>
                                                  <div className="flex-1 pt-0.5">
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                      {criterium.title}
                                                    </p>
                                                    {criterium.omschrijving && (
                                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 text-justify">
                                                        {criterium.omschrijving}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </DisclosurePanel>
                                  </div>
                                )}
                              </Disclosure>
                            ))}
                          </div>
                        </div>
                      )}

                      {onderdeel.werkprocessen.length === 0 && (
                        <div className="px-4 pb-4 bg-white dark:bg-gray-900">
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            Geen werkprocessen toegewezen aan dit onderdeel
                          </p>
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
