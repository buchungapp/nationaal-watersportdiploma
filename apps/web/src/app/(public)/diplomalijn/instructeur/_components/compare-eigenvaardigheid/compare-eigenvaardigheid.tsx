"use client";

import { LockClosedIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buildComparison } from "./build-comparison";
import { CompareEmptyState } from "./empty-state";
import { ComparePanel } from "./compare-panel";
import { ModeToggle } from "./mode-toggle";
import { ProgramOverviewPanel } from "./program-overview-panel";
import type { CompareDiscipline, CompareLevel, ViewMode } from "./types";

const NONE = "";

const selectClassName = clsx(
  "mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5",
  "text-sm text-zinc-900 shadow-sm",
  "focus:border-branding-light focus:outline-none focus:ring-2 focus:ring-branding-light/30",
);

function findDefaultDiscipline(disciplines: CompareDiscipline[]) {
  return (
    disciplines.find((discipline) => {
      const withModules = discipline.levels.filter((level) => level.hasModules);
      return withModules.length >= 1;
    }) ?? disciplines[0]
  );
}

function defaultPrimaryLevel(discipline: CompareDiscipline | undefined) {
  if (!discipline) return undefined;
  return discipline.levels.find((level) => level.hasModules) ?? discipline.levels[0];
}

function compareTargetKey(disciplineId: string, programId: string) {
  return `${disciplineId}::${programId}`;
}

function parseCompareTargetKey(key: string) {
  const separator = key.indexOf("::");
  if (separator === -1) return null;
  return {
    disciplineId: key.slice(0, separator),
    programId: key.slice(separator + 2),
  };
}

function findLevel(
  disciplines: CompareDiscipline[],
  disciplineId: string,
  programId: string,
) {
  const discipline = disciplines.find((item) => item.id === disciplineId);
  return discipline?.levels.find((level) => level.programId === programId);
}

function findDiscipline(
  disciplines: CompareDiscipline[],
  disciplineId: string,
) {
  return disciplines.find((item) => item.id === disciplineId);
}

function levelDisplayLabel(
  discipline: CompareDiscipline,
  level: CompareLevel,
) {
  return `${discipline.title} — ${level.label}`;
}

function resolveInitialDisciplineId(
  disciplines: CompareDiscipline[],
  param: string | null,
) {
  if (!param) return null;

  const exact = disciplines.find(
    (item) => item.id === param || item.handle === param,
  );
  if (exact) return exact.id;

  const prefix = `${param}:`;
  const prefixed = disciplines.find((item) => item.id.startsWith(prefix));
  return prefixed?.id ?? null;
}

/** Same discipline: always show NWD A left, NWD B right. */
function orderLevelsForCompare(
  primaryLevel: CompareLevel,
  compareLevel: CompareLevel,
  sameDiscipline: boolean,
) {
  if (!sameDiscipline) {
    return {
      leftLevel: primaryLevel,
      rightLevel: compareLevel,
    };
  }

  if (primaryLevel.letter === "B" && compareLevel.letter === "A") {
    return { leftLevel: compareLevel, rightLevel: primaryLevel };
  }

  return { leftLevel: primaryLevel, rightLevel: compareLevel };
}

export function CompareEigenvaardigheid({
  disciplines,
  canViewRequirements,
}: {
  disciplines: CompareDiscipline[];
  canViewRequirements: boolean;
}) {
  const searchParams = useSearchParams();
  const disciplineParam = searchParams.get("discipline");

  const defaultDiscipline = findDefaultDiscipline(disciplines);
  const initialDisciplineId =
    resolveInitialDisciplineId(disciplines, disciplineParam) ??
    defaultDiscipline?.id ??
    "";

  const [disciplineId, setDisciplineId] = useState(initialDisciplineId);
  const [primaryProgramId, setPrimaryProgramId] = useState("");
  const [compareTargetKeyValue, setCompareTargetKeyValue] = useState(NONE);
  const [mode, setMode] = useState<ViewMode>("verschil");

  const discipline = useMemo(
    () => findDiscipline(disciplines, disciplineId),
    [disciplines, disciplineId],
  );

  const comparableLevels = useMemo(
    () => discipline?.levels.filter((level) => level.hasModules) ?? [],
    [discipline],
  );

  useEffect(() => {
    const resolved =
      resolveInitialDisciplineId(disciplines, disciplineParam) ??
      defaultDiscipline?.id;
    if (resolved) {
      setDisciplineId(resolved);
    }
  }, [disciplineParam, disciplines, defaultDiscipline?.id]);

  useEffect(() => {
    if (!discipline) return;
    const levels = discipline.levels.filter((level) => level.hasModules);
    const currentValid = levels.some(
      (level) => level.programId === primaryProgramId,
    );
    if (!currentValid) {
      setPrimaryProgramId(levels[0]?.programId ?? "");
    }
  }, [discipline, primaryProgramId]);

  useEffect(() => {
    if (!canViewRequirements) {
      setCompareTargetKeyValue(NONE);
    }
  }, [canViewRequirements]);

  const primaryLevel = findLevel(disciplines, disciplineId, primaryProgramId);

  const compareTarget = compareTargetKeyValue
    ? parseCompareTargetKey(compareTargetKeyValue)
    : null;
  const compareLevel = compareTarget
    ? findLevel(
        disciplines,
        compareTarget.disciplineId,
        compareTarget.programId,
      )
    : undefined;
  const compareDiscipline = compareTarget
    ? findDiscipline(disciplines, compareTarget.disciplineId)
    : undefined;

  const isCompareMode = Boolean(
    canViewRequirements && compareTargetKeyValue && compareLevel,
  );
  const isCrossDiscipline = Boolean(
    isCompareMode &&
      compareTarget &&
      compareTarget.disciplineId !== disciplineId,
  );
  const sameTarget = Boolean(
    isCompareMode &&
      compareTarget &&
      compareTarget.disciplineId === disciplineId &&
      compareTarget.programId === primaryProgramId,
  );

  const orderedLevels = useMemo(() => {
    if (!primaryLevel || !compareLevel || sameTarget) {
      return null;
    }

    return orderLevelsForCompare(
      primaryLevel,
      compareLevel,
      !isCrossDiscipline,
    );
  }, [primaryLevel, compareLevel, sameTarget, isCrossDiscipline]);

  const groups = useMemo(() => {
    if (!isCompareMode || !orderedLevels) {
      return [];
    }

    return buildComparison(
      orderedLevels.leftLevel.modules,
      orderedLevels.rightLevel.modules,
    );
  }, [isCompareMode, orderedLevels]);

  const effectiveMode: ViewMode = isCrossDiscipline ? "beschrijving" : mode;

  const handleDisciplineChange = (nextDisciplineId: string) => {
    setDisciplineId(nextDisciplineId);
    const nextDiscipline = findDiscipline(disciplines, nextDisciplineId);
    const nextPrimary = defaultPrimaryLevel(nextDiscipline);
    setPrimaryProgramId(nextPrimary?.programId ?? "");
    setCompareTargetKeyValue(NONE);
  };

  const handlePrimaryChange = (nextProgramId: string) => {
    setPrimaryProgramId(nextProgramId);
    if (
      compareTarget &&
      compareTarget.disciplineId === disciplineId &&
      compareTarget.programId === nextProgramId
    ) {
      setCompareTargetKeyValue(NONE);
    }
  };

  if (disciplines.length === 0) {
    return <CompareEmptyState />;
  }

  const primaryLabel =
    discipline && primaryLevel
      ? levelDisplayLabel(discipline, primaryLevel)
      : "";
  const compareLabel =
    compareDiscipline && compareLevel
      ? levelDisplayLabel(compareDiscipline, compareLevel)
      : "";

  const leftDiscipline =
    orderedLevels && compareDiscipline && discipline
      ? orderedLevels.leftLevel === primaryLevel
        ? discipline
        : compareDiscipline
      : discipline;
  const rightDiscipline =
    orderedLevels && compareDiscipline && discipline
      ? orderedLevels.rightLevel === compareLevel
        ? compareDiscipline
        : discipline
      : compareDiscipline;

  const leftLabel =
    leftDiscipline && orderedLevels
      ? levelDisplayLabel(leftDiscipline, orderedLevels.leftLevel)
      : primaryLabel;
  const rightLabel =
    rightDiscipline && orderedLevels
      ? levelDisplayLabel(rightDiscipline, orderedLevels.rightLevel)
      : compareLabel;

  return (
    <div className="not-prose mt-8 space-y-6">
      {!canViewRequirements ? (
        <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <LockClosedIcon className="mt-0.5 size-5 shrink-0 text-zinc-500" />
          <p className="text-sm text-zinc-600">
            Log in als actief instructeur om de volledige eisomschrijvingen te
            zien. Competentietitels blijven zichtbaar.{" "}
            <Link
              href="/login"
              className="font-semibold text-branding-light hover:underline"
            >
              Inloggen
            </Link>
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div
          className={clsx(
            "grid flex-1 gap-4 sm:grid-cols-2",
            canViewRequirements && "lg:grid-cols-3",
          )}
        >
          <div>
            <label
              htmlFor="explorer-discipline"
              className="block text-sm font-medium text-zinc-700"
            >
              Discipline
            </label>
            <select
              id="explorer-discipline"
              value={disciplineId}
              onChange={(event) => handleDisciplineChange(event.target.value)}
              className={selectClassName}
            >
              {disciplines.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="explorer-level"
              className="block text-sm font-medium text-zinc-700"
            >
              Niveau
            </label>
            <select
              id="explorer-level"
              value={primaryProgramId}
              onChange={(event) => handlePrimaryChange(event.target.value)}
              className={selectClassName}
            >
              {comparableLevels.map((level) => (
                <option key={level.programId} value={level.programId}>
                  {isCrossDiscipline && discipline
                    ? levelDisplayLabel(discipline, level)
                    : level.label}
                </option>
              ))}
            </select>
          </div>

          {canViewRequirements ? (
            <div>
              <label
                htmlFor="explorer-compare"
                className="block text-sm font-medium text-zinc-700"
              >
                Vergelijken met
              </label>
              <select
                id="explorer-compare"
                value={compareTargetKeyValue}
                onChange={(event) =>
                  setCompareTargetKeyValue(event.target.value)
                }
                className={selectClassName}
              >
                <option value={NONE}>— Geen —</option>
                {disciplines.map((item) => {
                  const levels = item.levels.filter(
                    (level) => level.hasModules,
                  );
                  if (levels.length === 0) return null;

                  return (
                    <optgroup key={item.id} label={item.title}>
                      {levels.map((level) => (
                        <option
                          key={compareTargetKey(item.id, level.programId)}
                          value={compareTargetKey(item.id, level.programId)}
                        >
                          {isCrossDiscipline
                            ? levelDisplayLabel(item, level)
                            : level.label}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>
          ) : null}
        </div>

        {isCompareMode && !isCrossDiscipline ? (
          <ModeToggle value={mode} onChange={setMode} />
        ) : null}
      </div>

      {!isCompareMode && primaryLevel ? (
        <ProgramOverviewPanel
          level={primaryLevel}
          canViewRequirements={canViewRequirements}
        />
      ) : null}

      {isCompareMode && sameTarget ? (
        <p className="text-sm text-amber-700" role="status">
          Kies een ander niveau of discipline om te vergelijken.
        </p>
      ) : null}

      {isCompareMode &&
      !sameTarget &&
      groups.length > 0 &&
      orderedLevels ? (
        <ComparePanel
          groups={groups}
          mode={effectiveMode}
          leftLabel={leftLabel}
          rightLabel={rightLabel}
          leftLetter={orderedLevels.leftLevel.letter}
          rightLetter={orderedLevels.rightLevel.letter}
          canViewRequirements={canViewRequirements}
        />
      ) : null}

      {isCompareMode &&
      !sameTarget &&
      groups.length === 0 &&
      primaryLevel?.hasModules &&
      compareLevel?.hasModules ? (
        <CompareEmptyState />
      ) : null}
    </div>
  );
}
