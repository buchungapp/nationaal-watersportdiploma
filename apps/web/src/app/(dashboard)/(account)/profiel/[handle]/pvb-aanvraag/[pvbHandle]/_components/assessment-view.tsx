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
} from "@heroicons/react/16/solid";
import dayjs from "dayjs";
import { useOptimisticAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import {
  updatePvbBeoordelingsCriteriaAction,
  updatePvbBeoordelingsCriteriumAction,
} from "~/app/_actions/pvb/assessment-action";
import type {
  getPvbBeoordelingsCriteria,
  getPvbToetsdocumenten,
  retrievePvbAanvraagByHandle,
} from "~/lib/nwd";

interface AssessmentViewProps {
  toetsdocumenten: Awaited<ReturnType<typeof getPvbToetsdocumenten>>[number];
  aanvraag: Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>;
  beoordelingsCriteria: Awaited<
    ReturnType<typeof getPvbBeoordelingsCriteria>
  >["items"];
  personId: string;
}

interface SelectAllCheckboxProps {
  id: string;
  criteriaKeys: string[];
  selectedCriteria: Set<string>;
  setSelectedCriteria: (selected: Set<string>) => void;
}

function SelectAllCheckbox({
  id,
  criteriaKeys,
  selectedCriteria,
  setSelectedCriteria,
}: SelectAllCheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  // Calculate selection state
  const selectedCount = criteriaKeys.filter((key) =>
    selectedCriteria.has(key),
  ).length;
  const totalCount = criteriaKeys.length;

  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  // Set indeterminate state on the DOM element
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSelection = new Set(selectedCriteria);

    if (e.target.checked) {
      // Add all criteria keys
      for (const key of criteriaKeys) {
        newSelection.add(key);
      }
    } else {
      // Remove all criteria keys
      for (const key of criteriaKeys) {
        newSelection.delete(key);
      }
    }

    setSelectedCriteria(newSelection);
  };

  return (
    <input
      ref={checkboxRef}
      id={id}
      type="checkbox"
      checked={isAllSelected}
      onChange={handleChange}
      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
    />
  );
}

interface OptimisticState {
  criteria: AssessmentViewProps["beoordelingsCriteria"];
  onderdelen: AssessmentViewProps["aanvraag"]["onderdelen"];
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

  // State for selected criteria (for bulk actions)
  const [selectedCriteria, setSelectedCriteria] = useState<Set<string>>(
    new Set(),
  );

  // Optimistic action for criteria updates
  const criteriumAction = useOptimisticAction(
    updatePvbBeoordelingsCriteriumAction,
    {
      currentState: {
        criteria: beoordelingsCriteria,
        onderdelen: aanvraag.onderdelen,
      },
      updateFn: (state, input) => {
        const updatedCriteria = state.criteria.map((criterium) => {
          if (
            criterium.pvbOnderdeelId === input.pvbOnderdeelId &&
            criterium.beoordelingscriteriumId === input.beoordelingscriteriumId
          ) {
            return {
              ...criterium,
              behaald: input.behaald,
              opmerkingen: input.opmerkingen ?? criterium.opmerkingen,
            };
          }
          return criterium;
        });

        return {
          ...state,
          criteria: updatedCriteria,
        };
      },
      onSuccess: () => {
        toast.success("Criterium bijgewerkt");
      },
      onError: ({ error }) => {
        if (error && "serverError" in error && error.serverError) {
          toast.error(error.serverError);
        } else {
          toast.error("Er ging iets mis");
        }
      },
    },
  );

  // Optimistic action for batch criteria updates
  const batchCriteriaAction = useOptimisticAction(
    updatePvbBeoordelingsCriteriaAction,
    {
      currentState: {
        criteria: beoordelingsCriteria,
        onderdelen: aanvraag.onderdelen,
      },
      updateFn: (state, input) => {
        const updatedCriteria = state.criteria.map((criterium) => {
          const update = input.updates.find(
            (u) =>
              u.pvbOnderdeelId === criterium.pvbOnderdeelId &&
              u.beoordelingscriteriumId === criterium.beoordelingscriteriumId,
          );
          if (update) {
            return {
              ...criterium,
              behaald: update.behaald,
              opmerkingen: update.opmerkingen ?? criterium.opmerkingen,
            };
          }
          return criterium;
        });

        return {
          ...state,
          criteria: updatedCriteria,
        };
      },
      onSuccess: ({ data }) => {
        toast.success(data?.message || "Criteria bijgewerkt");
        setSelectedCriteria(new Set()); // Clear selection after successful update
      },
      onError: ({ error }) => {
        console.error("Batch action error:", error);
        if (error && "serverError" in error && error.serverError) {
          toast.error(error.serverError);
        } else if (
          error &&
          "validationErrors" in error &&
          error.validationErrors
        ) {
          const errors = Object.values(error.validationErrors).flat();
          toast.error(errors.join(", ") || "Validatie fout");
        } else {
          toast.error("Er ging iets mis");
        }
      },
    },
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

  // Use optimistic state for display - check both actions for the most recent state
  const optimisticCriteria = batchCriteriaAction.isPending
    ? batchCriteriaAction.optimisticState.criteria
    : criteriumAction.optimisticState.criteria;

  // Create maps for quick lookups
  const onderdeelDataMap = new Map(
    aanvraag.onderdelen.map((onderdeel) => [
      onderdeel.kerntaakOnderdeelId,
      onderdeel,
    ]),
  );

  const criteriaStatusMap = new Map(
    optimisticCriteria.map((criteria) => [
      `${criteria.pvbOnderdeelId}___${criteria.beoordelingscriteriumId}`,
      criteria,
    ]),
  );

  // Update criterium status
  const updateCriteriumStatus = (
    pvbOnderdeelId: string,
    beoordelingscriteriumId: string,
    behaald: boolean | null,
  ) => {
    const remark =
      criteriaRemarks[`${pvbOnderdeelId}___${beoordelingscriteriumId}`];

    criteriumAction.execute({
      handle: aanvraag.handle,
      pvbOnderdeelId,
      beoordelingscriteriumId,
      behaald,
      opmerkingen: remark,
    });
  };

  // Mark all criteria as behaald for an onderdeel
  const markAllCriteriaAsBehaald = async (
    pvbOnderdeelId: string,
    kerntaakId: string,
  ) => {
    // Find all criteria for this onderdeel
    const relevantCriteria =
      toetsdocumenten.kerntaken
        .find((k) => k.id === kerntaakId)
        ?.onderdelen.find(
          (o) => onderdeelDataMap.get(o.id)?.id === pvbOnderdeelId,
        )
        ?.werkprocessen.flatMap((w) => w.beoordelingscriteria) || [];

    // Build updates for all criteria that aren't already behaald
    const updates = [];
    for (const criterium of relevantCriteria) {
      const key = `${pvbOnderdeelId}___${criterium.id}`;
      const currentStatus = criteriaStatusMap.get(key);

      // Only update if not already behaald
      if (currentStatus?.behaald !== true) {
        updates.push({
          pvbOnderdeelId,
          beoordelingscriteriumId: criterium.id,
          behaald: true,
          opmerkingen: criteriaRemarks[key],
        });
      }
    }

    if (updates.length === 0) {
      toast.info("Alle criteria zijn al behaald");
      return;
    }

    // Use bulk action to update all at once
    await batchCriteriaAction.execute({
      handle: aanvraag.handle,
      updates,
    });
  };

  // Helper function to get werkproces status
  const getWerkprocesStatus = (
    pvbOnderdeelId: string | null,
    werkproces: { beoordelingscriteria: Array<{ id: string }> },
  ): "checked" | "indeterminate" | "unchecked" => {
    if (!pvbOnderdeelId) return "unchecked";
    if (werkproces.beoordelingscriteria.length === 0) return "unchecked";

    let behaaldCount = 0;
    let assessedCount = 0;
    const totalCount = werkproces.beoordelingscriteria.length;

    for (const criterium of werkproces.beoordelingscriteria) {
      const key = `${pvbOnderdeelId}___${criterium.id}`;
      const criteriumStatus = criteriaStatusMap.get(key);
      if (criteriumStatus?.behaald !== null) {
        assessedCount++;
        if (criteriumStatus?.behaald === true) {
          behaaldCount++;
        }
      }
    }

    if (assessedCount === totalCount && behaaldCount === totalCount) {
      return "checked";
    }
    if (assessedCount > 0) {
      return "indeterminate";
    }
    return "unchecked";
  };

  // Helper to check if all criteria are assessed for an onderdeel
  const areAllCriteriaAssessed = (
    pvbOnderdeelId: string,
    kerntaakId: string,
  ): boolean => {
    // Find the kerntaak and onderdeel in toetsdocumenten
    const kerntaak = toetsdocumenten.kerntaken.find((k) => k.id === kerntaakId);
    if (!kerntaak) return false;

    const onderdeel = kerntaak.onderdelen.find(
      (o) => onderdeelDataMap.get(o.id)?.id === pvbOnderdeelId,
    );
    if (!onderdeel) return false;

    // Get all criteria for this onderdeel
    const allCriteriaIds: string[] = [];
    for (const werkproces of onderdeel.werkprocessen) {
      for (const criterium of werkproces.beoordelingscriteria) {
        allCriteriaIds.push(criterium.id);
      }
    }

    // Check if all criteria have been assessed (behaald !== null)
    for (const criteriumId of allCriteriaIds) {
      const key = `${pvbOnderdeelId}___${criteriumId}`;
      const status = criteriaStatusMap.get(key);
      if (!status || status.behaald === null) {
        return false;
      }
    }

    return true;
  };

  // Helper to get assessment progress for an onderdeel
  const getAssessmentProgress = (
    pvbOnderdeelId: string,
    kerntaakId: string,
  ): { assessed: number; total: number } => {
    // Find the kerntaak and onderdeel in toetsdocumenten
    const kerntaak = toetsdocumenten.kerntaken.find((k) => k.id === kerntaakId);
    if (!kerntaak) return { assessed: 0, total: 0 };

    const onderdeel = kerntaak.onderdelen.find(
      (o) => onderdeelDataMap.get(o.id)?.id === pvbOnderdeelId,
    );
    if (!onderdeel) return { assessed: 0, total: 0 };

    // Count all criteria and assessed ones
    let totalCount = 0;
    let assessedCount = 0;

    for (const werkproces of onderdeel.werkprocessen) {
      for (const criterium of werkproces.beoordelingscriteria) {
        totalCount++;
        const key = `${pvbOnderdeelId}___${criterium.id}`;
        const status = criteriaStatusMap.get(key);
        if (status && status.behaald !== null) {
          assessedCount++;
        }
      }
    }

    return { assessed: assessedCount, total: totalCount };
  };

  // Helper to check if all criteria are behaald
  const areAllCriteriaBehaald = (
    pvbOnderdeelId: string,
    kerntaakId: string,
  ): boolean => {
    // Find the kerntaak and onderdeel in toetsdocumenten
    const kerntaak = toetsdocumenten.kerntaken.find((k) => k.id === kerntaakId);
    if (!kerntaak) return false;

    const onderdeel = kerntaak.onderdelen.find(
      (o) => onderdeelDataMap.get(o.id)?.id === pvbOnderdeelId,
    );
    if (!onderdeel) return false;

    // Check all criteria
    for (const werkproces of onderdeel.werkprocessen) {
      for (const criterium of werkproces.beoordelingscriteria) {
        const key = `${pvbOnderdeelId}___${criterium.id}`;
        const status = criteriaStatusMap.get(key);
        // If any criterium is not behaald (null or false), return false
        if (!status || status.behaald !== true) {
          return false;
        }
      }
    }

    return true;
  };

  // Batch update selected criteria
  const batchUpdateSelectedCriteria = async (behaald: boolean) => {
    console.log("Selected criteria keys:", Array.from(selectedCriteria));

    const updates = Array.from(selectedCriteria)
      .map((key) => {
        const parts = key.split("___");
        console.log(`Key: ${key}, Parts:`, parts);

        if (parts.length !== 2) {
          console.warn(
            `Invalid key format: ${key}, parts length: ${parts.length}`,
          );
          return null;
        }

        const [pvbOnderdeelId, beoordelingscriteriumId] = parts;
        if (!pvbOnderdeelId || !beoordelingscriteriumId) {
          console.warn(`Invalid key parts: ${key}`, {
            pvbOnderdeelId,
            beoordelingscriteriumId,
          });
          return null;
        }

        return {
          pvbOnderdeelId,
          beoordelingscriteriumId,
          behaald,
          opmerkingen: criteriaRemarks[key],
        };
      })
      .filter(
        (update): update is NonNullable<typeof update> => update !== null,
      );

    console.log("Updates to send:", updates);

    if (updates.length === 0) {
      toast.error("Geen geldige criteria geselecteerd");
      return;
    }

    // Try batch update first
    try {
      await batchCriteriaAction.execute({
        handle: aanvraag.handle,
        updates,
      });
    } catch (error) {
      console.error(
        "Batch update failed, falling back to individual updates:",
        error,
      );

      // Fall back to individual updates if batch fails
      let successCount = 0;
      for (const update of updates) {
        try {
          await criteriumAction.execute({
            handle: aanvraag.handle,
            ...update,
          });
          successCount++;
        } catch (err) {
          console.error(
            `Failed to update criterium ${update.beoordelingscriteriumId}:`,
            err,
          );
        }
      }

      if (successCount > 0) {
        toast.success(
          `${successCount} van ${updates.length} criteria bijgewerkt`,
        );
        setSelectedCriteria(new Set());
      } else {
        toast.error("Kon geen criteria bijwerken");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk action bar - floating to prevent layout shift */}
      {selectedCriteria.size > 0 && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 px-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between min-w-0">
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {selectedCriteria.size} geselecteerd
            </span>
            <div className="flex items-center gap-2 ml-4">
              <button
                type="button"
                onClick={() => batchUpdateSelectedCriteria(true)}
                disabled={batchCriteriaAction.isPending}
                className="px-2.5 py-1 text-sm rounded transition-colors bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Behaald
              </button>
              <button
                type="button"
                onClick={() => batchUpdateSelectedCriteria(false)}
                disabled={batchCriteriaAction.isPending}
                className="px-2.5 py-1 text-sm rounded transition-colors bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Niet behaald
              </button>
              <button
                type="button"
                onClick={() => setSelectedCriteria(new Set())}
                className="px-2.5 py-1 text-sm rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 whitespace-nowrap"
              >
                Annuleer
              </button>
            </div>
          </div>
        </div>
      )}

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

                  const progress = pvbData
                    ? getAssessmentProgress(pvbData.id, kerntaak.id)
                    : { assessed: 0, total: 0 };
                  const allAssessed = pvbData
                    ? areAllCriteriaAssessed(pvbData.id, kerntaak.id)
                    : false;

                  return (
                    <div
                      key={onderdeel.id}
                      className={`border-l-4 ${borderColor}`}
                    >
                      {/* Header section */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-baseline gap-3">
                              <h5 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                {formatOnderdeelType(onderdeel.type)}
                              </h5>
                              {progress.total > 0 && (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {progress.assessed}/{progress.total}{" "}
                                  beoordeeld
                                </span>
                              )}
                            </div>

                            {/* Metadata inline */}
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                              <span>{formatName(pvbData.beoordelaar)}</span>
                              {pvbData?.startDatumTijd && (
                                <>
                                  <span className="text-gray-400 dark:text-gray-600">
                                    •
                                  </span>
                                  <span>
                                    {dayjs(pvbData.startDatumTijd).format(
                                      "DD-MM-YYYY HH:mm",
                                    )}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!allAssessed ? (
                              <div className="text-right">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                  Beoordeel eerst alle criteria
                                </p>
                                {progress.assessed < progress.total && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      markAllCriteriaAsBehaald(
                                        pvbData.id,
                                        kerntaak.id,
                                      )
                                    }
                                    disabled={criteriumAction.isPending}
                                    className="text-sm px-4 py-2 font-medium rounded-md transition-colors bg-green-100 text-green-700 hover:bg-green-500 hover:text-white dark:bg-green-600 dark:hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                                  >
                                    <CheckIcon className="w-4 h-4 mr-1.5" />
                                    Alles als behaald markeren
                                  </button>
                                )}
                              </div>
                            ) : (
                              // Show calculated status based on criteria
                              <Badge
                                color={
                                  areAllCriteriaBehaald(pvbData.id, kerntaak.id)
                                    ? "green"
                                    : "red"
                                }
                              >
                                {areAllCriteriaBehaald(pvbData.id, kerntaak.id)
                                  ? "Behaald"
                                  : "Niet behaald"}
                              </Badge>
                            )}
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
                                werkproces,
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
                                            <div
                                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                werkprocesStatus === "checked"
                                                  ? "bg-green-500 border-green-500"
                                                  : werkprocesStatus ===
                                                      "indeterminate"
                                                    ? "bg-yellow-500 border-yellow-500"
                                                    : "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                              }`}
                                            >
                                              {werkprocesStatus ===
                                                "checked" && (
                                                <CheckIcon className="w-3 h-3 text-white" />
                                              )}
                                              {werkprocesStatus ===
                                                "indeterminate" && (
                                                <span className="text-xs text-white font-bold">
                                                  !
                                                </span>
                                              )}
                                            </div>
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
                                            <div className="flex items-center justify-between">
                                              <h6 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                                Beoordelingscriteria
                                              </h6>
                                              {pvbData && (
                                                <div className="flex items-center gap-1">
                                                  <label
                                                    htmlFor={`select-all-${pvbData.id}-${werkproces.id}`}
                                                    className="text-xs text-gray-500 dark:text-gray-400"
                                                  >
                                                    Selecteer alle:
                                                  </label>
                                                  <SelectAllCheckbox
                                                    id={`select-all-${pvbData.id}-${werkproces.id}`}
                                                    criteriaKeys={werkproces.beoordelingscriteria.map(
                                                      (criterium) =>
                                                        `${pvbData.id}___${criterium.id}`,
                                                    )}
                                                    selectedCriteria={
                                                      selectedCriteria
                                                    }
                                                    setSelectedCriteria={
                                                      setSelectedCriteria
                                                    }
                                                  />
                                                </div>
                                              )}
                                            </div>
                                            <div className="space-y-3">
                                              {werkproces.beoordelingscriteria.map(
                                                (criterium) => {
                                                  const criteriumStatus =
                                                    pvbData?.id
                                                      ? criteriaStatusMap.get(
                                                          `${pvbData.id}___${criterium.id}`,
                                                        )
                                                      : null;
                                                  const remarkKey = `${pvbData?.id}___${criterium.id}`;

                                                  return (
                                                    <div
                                                      key={criterium.id}
                                                      className="space-y-2 py-2"
                                                    >
                                                      <div className="flex items-start gap-3">
                                                        {/* Assessment status indicator */}
                                                        <div className="flex items-center justify-center w-5 h-5 rounded-full mt-1 flex-shrink-0">
                                                          {criteriumStatus?.behaald ===
                                                          true ? (
                                                            <div className="w-5 h-5 bg-green-100 border border-green-300 rounded-full flex items-center justify-center">
                                                              <CheckIcon className="w-3 h-3 text-green-600" />
                                                            </div>
                                                          ) : criteriumStatus?.behaald ===
                                                            false ? (
                                                            <div className="w-5 h-5 bg-red-100 border border-red-300 rounded-full flex items-center justify-center">
                                                              <svg
                                                                className="w-3 h-3 text-red-600"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                              >
                                                                <path
                                                                  strokeLinecap="round"
                                                                  strokeLinejoin="round"
                                                                  strokeWidth={
                                                                    2
                                                                  }
                                                                  d="M6 18L18 6M6 6l12 12"
                                                                />
                                                              </svg>
                                                            </div>
                                                          ) : (
                                                            <div className="w-5 h-5 bg-gray-100 border border-gray-300 rounded-full dark:bg-gray-700 dark:border-gray-600" />
                                                          )}
                                                        </div>

                                                        <div className="flex-1 space-y-2">
                                                          <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                              {criterium.title}
                                                            </div>
                                                            {criterium.omschrijving && (
                                                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                                                {
                                                                  criterium.omschrijving
                                                                }
                                                              </p>
                                                            )}
                                                          </div>

                                                          {/* Assessment actions */}
                                                          <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1">
                                                              <button
                                                                type="button"
                                                                onClick={() =>
                                                                  pvbData &&
                                                                  updateCriteriumStatus(
                                                                    pvbData.id,
                                                                    criterium.id,
                                                                    true,
                                                                  )
                                                                }
                                                                disabled={
                                                                  criteriumAction.isPending
                                                                }
                                                                className={`
                                                                  px-3 py-1.5 text-xs font-medium rounded transition-colors
                                                                  ${
                                                                    criteriumStatus?.behaald ===
                                                                    true
                                                                      ? "bg-green-500 text-white shadow-sm"
                                                                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                                                                  }
                                                                  disabled:opacity-50 disabled:cursor-not-allowed
                                                                `}
                                                              >
                                                                Behaald
                                                              </button>

                                                              <button
                                                                type="button"
                                                                onClick={() =>
                                                                  pvbData &&
                                                                  updateCriteriumStatus(
                                                                    pvbData.id,
                                                                    criterium.id,
                                                                    false,
                                                                  )
                                                                }
                                                                disabled={
                                                                  criteriumAction.isPending
                                                                }
                                                                className={`
                                                                  px-3 py-1.5 text-xs font-medium rounded transition-colors
                                                                  ${
                                                                    criteriumStatus?.behaald ===
                                                                    false
                                                                      ? "bg-red-500 text-white shadow-sm"
                                                                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                                                  }
                                                                  disabled:opacity-50 disabled:cursor-not-allowed
                                                                `}
                                                              >
                                                                Niet behaald
                                                              </button>
                                                            </div>

                                                            {/* Batch selection checkbox - moved to the right with clear label */}
                                                            <div className="flex items-center gap-1 ml-auto">
                                                              <label
                                                                htmlFor={`checkbox-${remarkKey}`}
                                                                className="text-xs text-gray-500 dark:text-gray-400"
                                                              >
                                                                Selecteer:
                                                              </label>
                                                              <input
                                                                id={`checkbox-${remarkKey}`}
                                                                type="checkbox"
                                                                checked={selectedCriteria.has(
                                                                  remarkKey,
                                                                )}
                                                                onChange={(
                                                                  e,
                                                                ) => {
                                                                  const newSelection =
                                                                    new Set(
                                                                      selectedCriteria,
                                                                    );
                                                                  if (
                                                                    e.target
                                                                      .checked
                                                                  ) {
                                                                    newSelection.add(
                                                                      remarkKey,
                                                                    );
                                                                  } else {
                                                                    newSelection.delete(
                                                                      remarkKey,
                                                                    );
                                                                  }
                                                                  setSelectedCriteria(
                                                                    newSelection,
                                                                  );
                                                                }}
                                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                                                disabled={
                                                                  criteriumAction.isPending ||
                                                                  batchCriteriaAction.isPending
                                                                }
                                                              />
                                                            </div>
                                                          </div>

                                                          {/* Comments section */}
                                                          <div>
                                                            <Textarea
                                                              placeholder="Opmerking..."
                                                              rows={1}
                                                              className="text-xs"
                                                              value={
                                                                criteriaRemarks[
                                                                  remarkKey
                                                                ] ||
                                                                criteriumStatus?.opmerkingen ||
                                                                ""
                                                              }
                                                              onChange={(e) =>
                                                                setCriteriaRemarks(
                                                                  {
                                                                    ...criteriaRemarks,
                                                                    [remarkKey]:
                                                                      e.target
                                                                        .value,
                                                                  },
                                                                )
                                                              }
                                                              onBlur={() => {
                                                                if (
                                                                  pvbData &&
                                                                  criteriaRemarks[
                                                                    remarkKey
                                                                  ] !==
                                                                    criteriumStatus?.opmerkingen
                                                                ) {
                                                                  updateCriteriumStatus(
                                                                    pvbData.id,
                                                                    criterium.id,
                                                                    criteriumStatus?.behaald ??
                                                                      null,
                                                                  );
                                                                }
                                                              }}
                                                              disabled={
                                                                criteriumAction.isPending
                                                              }
                                                            />
                                                          </div>
                                                        </div>
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
