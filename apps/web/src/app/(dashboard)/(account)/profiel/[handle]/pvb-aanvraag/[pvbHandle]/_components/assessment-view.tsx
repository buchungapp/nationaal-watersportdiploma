"use client";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import { CalendarIcon, UserIcon } from "@heroicons/react/20/solid";
import { useOptimistic, useState, startTransition } from "react";
import dayjs from "dayjs";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import { Checkbox, CheckboxField } from "~/app/(dashboard)/_components/checkbox";
import { Input } from "~/app/(dashboard)/_components/input";
import { Label } from "~/app/(dashboard)/_components/fieldset";
import { toast } from "sonner";
import type {
  getPvbBeoordelingsCriteria,
  getPvbToetsdocumenten,
  retrievePvbAanvraagByHandle,
} from "~/lib/nwd";
import {
  updatePvbBeoordelingsCriteriumAction,
  updatePvbOnderdeelUitslagAction,
} from "~/app/_actions/pvb/assessment-action";

interface AssessmentViewProps {
  toetsdocumenten: Awaited<ReturnType<typeof getPvbToetsdocumenten>>[number];
  aanvraag: Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>;
  beoordelingsCriteria: Awaited<
    ReturnType<typeof getPvbBeoordelingsCriteria>
  >["items"];
  personId: string;
}

interface OptimisticCriteriumUpdate {
  pvbOnderdeelId: string;
  beoordelingscriteriumId: string;
  behaald: boolean | null;
  opmerkingen?: string;
}

interface OptimisticOnderdeelUpdate {
  pvbOnderdeelId: string;
  uitslag: "behaald" | "niet_behaald" | "nog_niet_bekend";
}

export function AssessmentView({
  toetsdocumenten,
  aanvraag,
  beoordelingsCriteria,
  personId,
}: AssessmentViewProps) {
  // State for remarks
  const [criteriaRemarks, setCriteriaRemarks] = useState<
    Record<string, string>
  >({});

  // Optimistic state for criteria
  const [optimisticCriteria, setOptimisticCriteria] = useOptimistic(
    beoordelingsCriteria,
    (currentCriteria, updates: OptimisticCriteriumUpdate[]) => {
      const updatesMap = new Map(
        updates.map((u) => [
          `${u.pvbOnderdeelId}-${u.beoordelingscriteriumId}`,
          u,
        ])
      );

      return currentCriteria.map((criterium) => {
        const key = `${criterium.pvbOnderdeelId}-${criterium.beoordelingscriteriumId}`;
        const update = updatesMap.get(key);
        if (update) {
          return {
            ...criterium,
            behaald: update.behaald,
            opmerkingen: update.opmerkingen ?? criterium.opmerkingen,
          };
        }
        return criterium;
      });
    }
  );

  // Optimistic state for onderdeel uitslag
  const [optimisticOnderdelen, setOptimisticOnderdelen] = useOptimistic(
    aanvraag.onderdelen,
    (currentOnderdelen, updates: OptimisticOnderdeelUpdate[]) => {
      const updatesMap = new Map(
        updates.map((u) => [u.pvbOnderdeelId, u])
      );

      return currentOnderdelen.map((onderdeel) => {
        const update = updatesMap.get(onderdeel.id);
        if (update) {
          return {
            ...onderdeel,
            uitslag: update.uitslag,
          };
        }
        return onderdeel;
      });
    }
  );

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

  // Create maps for quick lookups
  const onderdeelDataMap = new Map(
    optimisticOnderdelen.map((onderdeel) => [
      onderdeel.kerntaakOnderdeelId,
      onderdeel,
    ])
  );

  const criteriaStatusMap = new Map(
    optimisticCriteria.map((criteria) => [
      `${criteria.pvbOnderdeelId}-${criteria.beoordelingscriteriumId}`,
      criteria,
    ])
  );

  // Update criterium status
  const updateCriteriumStatus = async (
    pvbOnderdeelId: string,
    beoordelingscriteriumId: string,
    behaald: boolean | null
  ) => {
    const remark = criteriaRemarks[`${pvbOnderdeelId}-${beoordelingscriteriumId}`];

    startTransition(() => {
      setOptimisticCriteria([
        {
          pvbOnderdeelId,
          beoordelingscriteriumId,
          behaald,
          opmerkingen: remark,
        },
      ]);
    });

    try {
      const result = await updatePvbBeoordelingsCriteriumAction({
        handle: aanvraag.handle,
        pvbOnderdeelId,
        beoordelingscriteriumId,
        behaald,
        opmerkingen: remark,
      });

      if (result?.success) {
        toast.success("Criterium bijgewerkt");
      } else {
        throw new Error("Er is een fout opgetreden");
      }
    } catch (error) {
      toast.error("Er is een fout opgetreden bij het bijwerken");
      // Revert optimistic update on error
      startTransition(() => {
        setOptimisticCriteria([]);
      });
    }
  };

  // Update onderdeel uitslag
  const updateOnderdeelUitslag = async (
    pvbOnderdeelId: string,
    uitslag: "behaald" | "niet_behaald"
  ) => {
    startTransition(() => {
      setOptimisticOnderdelen([
        {
          pvbOnderdeelId,
          uitslag,
        },
      ]);
    });

    try {
      const result = await updatePvbOnderdeelUitslagAction({
        handle: aanvraag.handle,
        pvbOnderdeelId,
        uitslag,
      });

      if (result?.success) {
        toast.success("Onderdeel uitslag bijgewerkt");
      } else {
        throw new Error("Er is een fout opgetreden");
      }
    } catch (error) {
      toast.error("Er is een fout opgetreden bij het bijwerken");
      // Revert optimistic update on error
      startTransition(() => {
        setOptimisticOnderdelen([]);
      });
    }
  };

  // Helper function to get werkproces status
  const getWerkprocesStatus = (
    pvbOnderdeelId: string | null,
    werkproces: { beoordelingscriteria: Array<{ id: string }> }
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
    <div className="space-y-6">
      {/* Kwalificatieprofiel Header */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {toetsdocumenten.kwalificatieprofiel.titel}
        </h3>
      </div>

      {/* Kerntaken */}
      <div className="space-y-4">
        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Toetsdocumenten - Je kunt beoordelen
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

                  // Only show if user is the beoordelaar for this onderdeel
                  if (pvbData?.beoordelaar?.id !== personId) {
                    return null;
                  }

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
                          <div className="flex items-center gap-2">
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
                            {/* Quick actions for onderdeel */}
                            {pvbData?.uitslag === "nog_niet_bekend" && (
                              <div className="flex gap-1">
                                <Button
                                  color="green"
                                  onClick={() =>
                                    updateOnderdeelUitslag(pvbData.id, "behaald")
                                  }
                                >
                                  <CheckIcon />
                                  Behaald
                                </Button>
                                <Button
                                  color="red"
                                  onClick={() =>
                                    updateOnderdeelUitslag(
                                      pvbData.id,
                                      "niet_behaald"
                                    )
                                  }
                                >
                                  <XMarkIcon />
                                  Niet behaald
                                </Button>
                              </div>
                            )}
                          </div>
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
                              {formatName(pvbData.beoordelaar)} (Jij)
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
                                    "DD-MM-YYYY HH:mm [uur]"
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
                            {onderdeel.werkprocessen.map((werkproces) => {
                              const werkprocesStatus = getWerkprocesStatus(
                                pvbData?.id || null,
                                werkproces
                              );

                              return (
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
                                              checked={
                                                werkprocesStatus !== "unchecked"
                                              }
                                              indeterminate={
                                                werkprocesStatus ===
                                                "indeterminate"
                                              }
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
                                        {werkproces.beoordelingscriteria
                                          .length > 0 && (
                                          <div className="ml-11 mt-2 space-y-2">
                                            <h6 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                              Beoordelingscriteria
                                            </h6>
                                            <div className="space-y-3">
                                              {werkproces.beoordelingscriteria.map(
                                                (criterium) => {
                                                  const criteriumStatus =
                                                    pvbData?.id
                                                      ? criteriaStatusMap.get(
                                                          `${pvbData.id}-${criterium.id}`
                                                        )
                                                      : null;
                                                  const remarkKey = `${pvbData?.id}-${criterium.id}`;

                                                  return (
                                                    <div
                                                      key={criterium.id}
                                                      className="space-y-2"
                                                    >
                                                      <CheckboxField>
                                                        <Checkbox
                                                          checked={
                                                            criteriumStatus?.behaald ===
                                                            true
                                                          }
                                                          indeterminate={
                                                            criteriumStatus?.behaald ===
                                                            null
                                                          }
                                                          onChange={(checked) =>
                                                            updateCriteriumStatus(
                                                              pvbData!.id,
                                                              criterium.id,
                                                              checked
                                                                ? true
                                                                : null
                                                            )
                                                          }
                                                        />
                                                        <div>
                                                          <Label className="font-medium">
                                                            {criterium.title}
                                                          </Label>
                                                          {criterium.omschrijving && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 text-justify">
                                                              {
                                                                criterium.omschrijving
                                                              }
                                                            </p>
                                                          )}
                                                        </div>
                                                      </CheckboxField>
                                                      <div className="ml-7">
                                                        <Input
                                                          type="text"
                                                          placeholder="Optionele opmerking..."
                                                          className="text-sm"
                                                          value={
                                                            criteriaRemarks[
                                                              remarkKey
                                                            ] ||
                                                            criteriumStatus?.opmerkingen ||
                                                            ""
                                                          }
                                                          onChange={(e) =>
                                                            setCriteriaRemarks({
                                                              ...criteriaRemarks,
                                                              [remarkKey]:
                                                                e.target.value,
                                                            })
                                                          }
                                                          onBlur={() => {
                                                            if (
                                                              criteriaRemarks[
                                                                remarkKey
                                                              ] !==
                                                              criteriumStatus?.opmerkingen
                                                            ) {
                                                              updateCriteriumStatus(
                                                                pvbData!.id,
                                                                criterium.id,
                                                                criteriumStatus?.behaald ??
                                                                  null
                                                              );
                                                            }
                                                          }}
                                                        />
                                                      </div>
                                                    </div>
                                                  );
                                                }
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