"use client";

import { useOptimistic, type PropsWithChildren } from "react";
import {
  CompetencyTypeBadge,
  ModuleRequiredBadge,
} from "~/app/(dashboard)/_components/badges";
import {
  Checkbox,
  CheckboxField,
  CheckboxGroup,
} from "~/app/(dashboard)/_components/checkbox";
import { Label } from "~/app/(dashboard)/_components/fieldset";
import { Strong } from "~/app/(dashboard)/_components/text";
import { Weight } from "~/app/_components/weight";
import type { retrieveCurriculumById } from "~/lib/nwd";

export function CourseCardCheckbox({
  children,
  checked,
  disabled,
  indeterminate,
  setCompleted,
}: PropsWithChildren<{
  disabled: boolean;
  checked: boolean;
  indeterminate: boolean;
  setCompleted: (completed: boolean) => Promise<void>;
}>) {
  return (
    <CheckboxField disabled={disabled}>
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        onChange={setCompleted}
      />
      {children}
    </CheckboxField>
  );
}

export function Module({
  module,
  competenciesProgress,
  completedCompetencies,
}: {
  module: NonNullable<
    Awaited<ReturnType<typeof retrieveCurriculumById>>
  >["modules"][number];
  competenciesProgress: { id: string; progress: number }[];
  completedCompetencies: string[];
}) {
  const [optimisticProgress, setOptimisticProgress] = useOptimistic(
    competenciesProgress,
    (
      currentProgress,
      updatedProgress: {
        id: string;
        progress: number;
      }[],
    ) => {
      return currentProgress.map((cp) => {
        const updated = updatedProgress.find((up) => up.id === cp.id);
        return updated ?? cp;
      });
    },
  );

  const areAllCompetenciesCompleted = module.competencies.every((competency) =>
    completedCompetencies.includes(competency.id),
  );

  const areSomeCompetenciesSelected = module.competencies.some(
    (competency) =>
      completedCompetencies.includes(competency.id) ||
      (optimisticProgress.find((cp) => cp.id === competency.id)?.progress ??
        0) > 0,
  );

  const areAllCompetenciesSelected = module.competencies.every(
    (competency) =>
      completedCompetencies.includes(competency.id) ||
      (optimisticProgress.find((cp) => cp.id === competency.id)?.progress ??
        0) >= 100,
  );

  return (
    <CheckboxGroup role="group">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-x-2">
          <div className="flex-shrink-0 w-12">
            <Weight weight={module.weight} />
          </div>
          <CourseCardCheckbox
            disabled={areAllCompetenciesCompleted}
            checked={areAllCompetenciesCompleted || areSomeCompetenciesSelected}
            indeterminate={!areAllCompetenciesSelected}
            setCompleted={async (completed) => {
              setOptimisticProgress(
                module.competencies.map((competency) => ({
                  id: competency.id,
                  progress: completed ? 100 : 0,
                })),
              );

              return Promise.resolve();
            }}
          >
            <Label>
              <Strong>{module.title}</Strong>
            </Label>
          </CourseCardCheckbox>
        </div>
        <div className="flex items-center justify-end gap-x-2">
          <ModuleRequiredBadge
            type={module.isRequired ? "required" : "not-required"}
          />
          <CompetencyTypeBadge type={module.type} />
        </div>
      </div>

      <dl className="mt-2 space-y-1">
        {module.competencies.map((competency) => {
          const isCompletedInPreviousCertification =
            completedCompetencies.includes(competency.id);

          const competencyProgress =
            optimisticProgress.find((cp) => cp.id === competency.id)
              ?.progress ?? 0;

          return (
            <div key={competency.id} className="flex gap-x-2">
              <div className="flex-shrink-0 w-12">
                <Weight weight={competency.weight} />
              </div>

              <CourseCardCheckbox
                disabled={isCompletedInPreviousCertification}
                checked={
                  isCompletedInPreviousCertification || competencyProgress > 0
                }
                indeterminate={
                  !isCompletedInPreviousCertification &&
                  competencyProgress > 0 &&
                  competencyProgress < 100
                }
                setCompleted={async (completed) => {
                  setOptimisticProgress([
                    {
                      id: competency.id,
                      progress: completed ? 100 : 0,
                    },
                  ]);

                  return Promise.resolve();
                }}
              >
                <Label>{competency.title}</Label>
              </CourseCardCheckbox>
            </div>
          );
        })}
      </dl>
    </CheckboxGroup>
  );
}
