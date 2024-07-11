"use client";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { CheckIcon, MinusIcon, PlusIcon } from "@heroicons/react/16/solid";
import {
  useOptimistic,
  useState,
  useTransition,
  type PropsWithChildren,
} from "react";
import { toast } from "sonner";
import { ModuleRequiredBadge } from "~/app/(dashboard)/_components/badges";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
  CheckboxGroup,
} from "~/app/(dashboard)/_components/checkbox";
import { Description, Label } from "~/app/(dashboard)/_components/fieldset";
import { Switch, SwitchField } from "~/app/(dashboard)/_components/switch";
import { Strong } from "~/app/(dashboard)/_components/text";
import Spinner from "~/app/_components/spinner";
import { Weight } from "~/app/_components/weight";
import type { retrieveCurriculumById } from "~/lib/nwd";
import {
  updateBulkCompetencyProgress,
  updateSingleCompetencyProgress,
} from "../_actions/progress";

export function CompleteAllCoreModules({
  cohortAllocationId,
  competencyIds,
  disabled,
}: {
  cohortAllocationId: string;
  competencyIds: string[];
  disabled?: boolean;
}) {
  const [isBusy, startTransition] = useTransition();

  if (competencyIds.length < 1) {
    return null;
  }

  return (
    <Button
      outline
      disabled={disabled || isBusy}
      onClick={() => {
        startTransition(
          async () =>
            await updateBulkCompetencyProgress({
              cohortAllocationId,
              progressData: competencyIds.map((competencyId) => ({
                competencyId,
                progress: 100,
              })),
            }).catch(() => {
              toast.error("Er is iets misgegaan.");
            }),
        );
      }}
    >
      {isBusy ? <Spinner /> : <CheckIcon />}
      Voltooi alle kernmodules
    </Button>
  );
}

function CourseCardCheckbox({
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
    <CheckboxField disabled={disabled} className="">
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
  disabled,
  module,
  competenciesProgress,
  completedCompetencies,
  cohortAllocationId,
}: {
  disabled?: boolean;
  module: NonNullable<
    Awaited<ReturnType<typeof retrieveCurriculumById>>
  >["modules"][number];
  competenciesProgress: { id: string; progress: number }[];
  completedCompetencies: string[];
  cohortAllocationId: string;
}) {
  const [showRequirements, setShowRequirements] = useState(false);
  const [optimisticProgress, setOptimisticProgress] = useOptimistic(
    competenciesProgress,
    (
      currentProgress,
      updatedProgress: {
        id: string;
        progress: number;
      }[],
    ) => {
      // We have two scenarios:
      // 1. The competency does not yet exist in the current progress, and needs to be added
      // 2. The competency exists in the current progress, and needs to be updated
      // So we basically need to merge the two arrays, and on conflict (same competency id), we need to take the updated progress

      const progressMap = new Map<string, number>();

      // Fill the map with the current progress
      for (const cp of currentProgress) {
        progressMap.set(cp.id, cp.progress);
      }

      // Update the map with the updated progress values
      for (const up of updatedProgress) {
        progressMap.set(up.id, up.progress); // This will overwrite existing entries with the same id
      }

      // Convert the map back to an array
      return Array.from(progressMap, ([id, progress]) => ({ id, progress }));
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
    <Disclosure>
      {({ open: panelOpen }) => (
        <>
          <CheckboxGroup role="group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <DisclosureButton as={Button} plain>
                  {panelOpen ? <MinusIcon /> : <PlusIcon />}
                </DisclosureButton>

                <CourseCardCheckbox
                  disabled={disabled || areAllCompetenciesCompleted}
                  checked={
                    areAllCompetenciesCompleted || areSomeCompetenciesSelected
                  }
                  indeterminate={!areAllCompetenciesSelected}
                  setCompleted={async (completed) => {
                    setOptimisticProgress(
                      module.competencies.map((competency) => ({
                        id: competency.id,
                        progress: completed ? 100 : 0,
                      })),
                    );

                    await updateBulkCompetencyProgress({
                      cohortAllocationId,
                      progressData: module.competencies.map((competency) => ({
                        competencyId: competency.id,
                        progress: completed ? 100 : 0,
                      })),
                    }).catch(() => {
                      toast.error("Er is iets misgegaan.");
                    });

                    return;
                  }}
                >
                  <div className="flex gap-x-2">
                    <Weight weight={module.weight} />
                    <Label>
                      <Strong>{module.title}</Strong>
                    </Label>
                  </div>
                </CourseCardCheckbox>
              </div>
              <div className="flex items-center justify-end gap-x-2">
                <ModuleRequiredBadge
                  type={module.isRequired ? "required" : "not-required"}
                />
                {/* <CompetencyTypeBadge type={module.type} /> */}
              </div>
            </div>

            <DisclosurePanel className="mt-2 pl-[52px] sm:pl-11">
              <div className="flex">
                <SwitchField>
                  <Label>Toon eisen</Label>
                  <Switch
                    checked={showRequirements}
                    onChange={setShowRequirements}
                  />
                </SwitchField>
              </div>

              <dl className="space-y-1 mt-4">
                {module.competencies.map((competency) => {
                  const isCompletedInPreviousCertification =
                    completedCompetencies.includes(competency.id);

                  const competencyProgress =
                    optimisticProgress.find((cp) => cp.id === competency.id)
                      ?.progress ?? 0;

                  return (
                    <CourseCardCheckbox
                      key={competency.id}
                      disabled={disabled || isCompletedInPreviousCertification}
                      checked={
                        isCompletedInPreviousCertification ||
                        competencyProgress > 0
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

                        await updateSingleCompetencyProgress({
                          cohortAllocationId,
                          competencyId: competency.id,
                          progress: completed ? 100 : 0,
                        }).catch(() => {
                          toast.error("Er is iets misgegaan.");
                        });

                        return;
                      }}
                    >
                      <div className="flex gap-x-2">
                        <Weight weight={competency.weight} />
                        <Label>{competency.title}</Label>
                      </div>
                      {showRequirements ? (
                        <Description className="text-justify">
                          {competency.requirement}
                        </Description>
                      ) : null}
                    </CourseCardCheckbox>
                  );
                })}
              </dl>
            </DisclosurePanel>
          </CheckboxGroup>
        </>
      )}
    </Disclosure>
  );
}
