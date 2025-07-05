"use client";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { CalendarIcon, UserIcon } from "@heroicons/react/20/solid";
import dayjs from "dayjs";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Checkbox } from "~/app/(dashboard)/_components/checkbox";
import type {
  getPvbBeoordelingsCriteria,
  getPvbToetsdocumenten,
  retrievePvbAanvraagByHandle,
} from "~/lib/nwd";

interface ToetsdocumentenDisplayProps {
  toetsdocumenten: Awaited<ReturnType<typeof getPvbToetsdocumenten>>[number];
  aanvraag: Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>;
  beoordelingsCriteria: Awaited<
    ReturnType<typeof getPvbBeoordelingsCriteria>
  >["items"];
}

export function ToetsdocumentenDisplay({
  toetsdocumenten,
  aanvraag,
  beoordelingsCriteria,
}: ToetsdocumentenDisplayProps) {
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

  // Create a map to quickly lookup beoordelingscriteria status
  const criteriaStatusMap = new Map(
    beoordelingsCriteria.map((criteria) => [
      `${criteria.pvbOnderdeelId}-${criteria.beoordelingscriteriumId}`,
      criteria,
    ]),
  );

  // Helper function to get werkproces status based on its beoordelingscriteria
  const getWerkprocesStatus = (
    pvbOnderdeelId: string | null,
    werkproces: { beoordelingscriteria: Array<{ id: string }> },
  ): "checked" | "indeterminate" | "unchecked" => {
    if (!pvbOnderdeelId) return "unchecked";

    if (werkproces.beoordelingscriteria.length === 0) return "unchecked";

    let behaaldCount = 0;
    const totalCount = werkproces.beoordelingscriteria.length;

    for (const criterium of werkproces.beoordelingscriteria) {
      const key = `${pvbOnderdeelId}-${criterium.id}`;
      const criteriumStatus = criteriaStatusMap.get(key);
      if (criteriumStatus?.behaald === true) {
        behaaldCount++;
      }
    }

    if (behaaldCount === totalCount) {
      return "checked";
    }
    if (behaaldCount > 0) {
      return "indeterminate";
    }
    return "unchecked";
  };

  return (
    <div className="space-y-4">
      {/* Kwalificatieprofiel Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {toetsdocumenten.kwalificatieprofiel.titel}
        </h3>
      </div>

      {/* Kerntaken */}
      <div className="space-y-4">
        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
          <svg
            className="h-4 w-4 text-gray-600 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          Toetsdocumenten
        </h4>

        {toetsdocumenten.kerntaken.map((kerntaak) => (
          <div
            key={kerntaak.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {kerntaak.titel}
                </h4>
                <Badge
                  color={kerntaak.type === "verplicht" ? "blue" : "purple"}
                  className="text-xs"
                >
                  {kerntaak.type === "verplicht" ? "Verplicht" : "Facultatief"}
                </Badge>
              </div>
            </div>

            {/* Toetsvormen/Onderdelen */}
            {kerntaak.onderdelen.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {kerntaak.onderdelen.map((onderdeel) => {
                  const pvbData = onderdeelDataMap.get(onderdeel.id);
                  const borderColor =
                    onderdeel.type === "portfolio"
                      ? "border-blue-500 bg-blue-500/5 dark:bg-blue-500/10"
                      : "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10";

                  return (
                    <div
                      key={onderdeel.id}
                      className={`border-l-4 ${borderColor}`}
                    >
                      {/* Header section */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            {onderdeel.type === "portfolio" ? (
                              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                                <svg
                                  className="h-4 w-4 text-blue-600 dark:text-blue-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="1.5"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                                  />
                                </svg>
                              </div>
                            ) : (
                              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded">
                                <svg
                                  className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="1.5"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
                                  />
                                </svg>
                              </div>
                            )}
                            <h5 className="text-base font-medium text-gray-900 dark:text-gray-100">
                              {formatOnderdeelType(onderdeel.type)}
                            </h5>
                          </div>
                          <Badge
                            color={
                              pvbData?.uitslag === "behaald"
                                ? "green"
                                : pvbData?.uitslag === "niet_behaald"
                                  ? "red"
                                  : "zinc"
                            }
                            className="text-xs px-2 py-0.5"
                          >
                            {getBehaaldStatusLabel(pvbData?.uitslag)}
                          </Badge>
                        </div>

                        {/* Metadata section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {/* Beoordelaar */}
                          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                            <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded">
                              <UserIcon className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Beoordelaar
                              </p>
                              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                {pvbData?.beoordelaar
                                  ? formatName(pvbData.beoordelaar)
                                  : "Nog niet toegewezen"}
                              </p>
                            </div>
                          </div>

                          {/* Start datum */}
                          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                            <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded">
                              <CalendarIcon className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Aanvangstijdstip
                              </p>
                              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                {pvbData?.startDatumTijd
                                  ? dayjs(pvbData.startDatumTijd).format(
                                      "DD-MM-YYYY HH:mm",
                                    )
                                  : "Nog niet gepland"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Werkprocessen for this onderdeel */}
                      {onderdeel.werkprocessen.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                          <h6 className="px-4 pt-3 pb-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Werkprocessen
                          </h6>
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {onderdeel.werkprocessen.map((werkproces) => {
                              const werkprocesStatus = getWerkprocesStatus(
                                pvbData?.id || null,
                                werkproces,
                              );

                              return (
                                <Disclosure
                                  key={werkproces.id}
                                  defaultOpen={false}
                                >
                                  {({ open }) => (
                                    <div>
                                      <DisclosureButton className="flex w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors group">
                                        <div className="flex items-start gap-2 flex-1">
                                          <div
                                            className="mt-0.5 transition-transform duration-200"
                                            style={{
                                              transform: open
                                                ? "rotate(90deg)"
                                                : "rotate(0deg)",
                                            }}
                                          >
                                            <ChevronRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                                          </div>
                                          <div className="mt-0.5">
                                            <Checkbox
                                              checked={
                                                werkprocesStatus !== "unchecked"
                                              }
                                              indeterminate={
                                                werkprocesStatus ===
                                                "indeterminate"
                                              }
                                              disabled
                                              className="pointer-events-none h-3.5 w-3.5"
                                            />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2">
                                              <h6 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                {werkproces.titel}
                                              </h6>
                                              {werkproces.beoordelingscriteria
                                                .length > 0 && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                  (
                                                  {
                                                    werkproces
                                                      .beoordelingscriteria
                                                      .length
                                                  }
                                                  )
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                              {werkproces.resultaat}
                                            </p>
                                          </div>
                                        </div>
                                      </DisclosureButton>

                                      <DisclosurePanel className="px-4 pb-3 bg-white dark:bg-gray-900/50">
                                        {werkproces.beoordelingscriteria
                                          .length > 0 && (
                                          <div className="ml-8 mt-2 space-y-2">
                                            <h6 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                                              Beoordelingscriteria
                                            </h6>
                                            <div className="space-y-2">
                                              {werkproces.beoordelingscriteria.map(
                                                (criterium) => {
                                                  const criteriumStatus =
                                                    pvbData?.id
                                                      ? criteriaStatusMap.get(
                                                          `${pvbData.id}-${criterium.id}`,
                                                        )
                                                      : null;

                                                  return (
                                                    <div
                                                      key={criterium.id}
                                                      className="flex items-start gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                                                    >
                                                      <div className="mt-0.5">
                                                        <Checkbox
                                                          checked={
                                                            criteriumStatus?.behaald ===
                                                            true
                                                          }
                                                          disabled
                                                          className="pointer-events-none h-3.5 w-3.5"
                                                        />
                                                      </div>
                                                      <div className="flex-1">
                                                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                                          {criterium.title}
                                                        </p>
                                                        {criterium.omschrijving && (
                                                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                                            {
                                                              criterium.omschrijving
                                                            }
                                                          </p>
                                                        )}
                                                        {criteriumStatus?.opmerkingen && (
                                                          <div className="mt-1.5 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                                            <p className="text-xs text-blue-900 dark:text-blue-200">
                                                              <span className="font-semibold">
                                                                Opmerking:
                                                              </span>{" "}
                                                              {
                                                                criteriumStatus.opmerkingen
                                                              }
                                                            </p>
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                  );
                                                },
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </DisclosurePanel>
                                    </div>
                                  )}
                                </Disclosure>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {onderdeel.werkprocessen.length === 0 && (
                        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded">
                            <svg
                              className="h-4 w-4 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.007v.008H12v-.008z"
                              />
                            </svg>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Geen werkprocessen toegewezen aan dit onderdeel
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {kerntaak.onderdelen.length === 0 && (
              <div className="p-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Geen toetsvormen toegewezen aan deze kerntaak
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
