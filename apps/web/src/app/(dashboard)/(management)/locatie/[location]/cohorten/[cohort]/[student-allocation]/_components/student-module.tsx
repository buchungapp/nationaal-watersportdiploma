"use client";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  AdjustmentsHorizontalIcon,
  CheckIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/16/solid";
import {
  createContext,
  useContext,
  useOptimistic,
  useState,
  useTransition,
  type PropsWithChildren,
} from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { ModuleRequiredBadge } from "~/app/(dashboard)/_components/badges";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
  CheckboxGroup,
} from "~/app/(dashboard)/_components/checkbox";
import {
  Description,
  Field,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from "~/app/(dashboard)/_components/popover";
import {
  Switch,
  SwitchField,
  SwitchGroup,
} from "~/app/(dashboard)/_components/switch";
import { Strong } from "~/app/(dashboard)/_components/text";
import Spinner from "~/app/_components/spinner";
import { Weight } from "~/app/_components/weight";
import type { retrieveCurriculumById } from "~/lib/nwd";
import {
  updateBulkCompetencyProgress,
  updateSingleCompetencyProgress,
} from "../_actions/progress";

const CourseCardContext = createContext<
  | {
      advancedMode: boolean;
      toggleAdvancedMode: (value?: boolean) => void;
      showRequirements: boolean;
      toggleShowRequirements: (value?: boolean) => void;
    }
  | undefined
>(undefined);

export function CourseCardProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState({
    advancedMode: false,
    showRequirements: false,
  });

  return (
    <CourseCardContext.Provider
      value={{
        advancedMode: state.advancedMode,
        toggleAdvancedMode: (value) =>
          setState((prev) => ({
            ...prev,
            advancedMode: value ?? !prev.advancedMode,
          })),
        showRequirements: state.showRequirements,
        toggleShowRequirements: (value) =>
          setState((prev) => ({
            ...prev,
            showRequirements: value ?? !prev.showRequirements,
          })),
      }}
    >
      {children}
    </CourseCardContext.Provider>
  );
}

function useCourseCardSettings() {
  const context = useContext(CourseCardContext);

  if (!context) {
    throw new Error("useCourseCard must be used within a CourseCardProvider");
  }

  return context;
}

export function CourseCardViewSettings() {
  const {
    advancedMode,
    toggleAdvancedMode,
    showRequirements,
    toggleShowRequirements,
  } = useCourseCardSettings();

  return (
    <Popover>
      <PopoverButton outline>
        <AdjustmentsHorizontalIcon />
        Weergave
      </PopoverButton>
      <PopoverPanel anchor="bottom end" className="p-4">
        <SwitchGroup>
          <SwitchField>
            <Label>Toon eisen</Label>
            <Description>
              Toon de eisomschrijvingen bij de competenteis.
            </Description>
            <Switch
              checked={showRequirements}
              onChange={toggleShowRequirements}
            />
          </SwitchField>
          <SwitchField>
            <Label>Geavanceerde voortgang</Label>
            <Description>
              Voer een getal 0-100 in om de voortgang van een competentie bij te
              houden.
            </Description>
            <Switch checked={advancedMode} onChange={toggleAdvancedMode} />
          </SwitchField>
        </SwitchGroup>
      </PopoverPanel>
    </Popover>
  );
}

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
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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

function ProgressInput({
  children,
  value,
  disabled,
  indeterminate,
  setCompleted,
}: PropsWithChildren<{
  disabled: boolean;
  value: number;
  indeterminate: boolean;
  setCompleted: (newProgress: number) => Promise<void>;
}>) {
  const { advancedMode } = useCourseCardSettings();

  const [localValue, setLocalValue] = useState(value);

  // Debounce the setCompleted call
  const debouncedSetCompleted = useDebouncedCallback(setCompleted, 600);

  if (advancedMode) {
    return (
      <Field className="flex items-center gap-x-2">
        <Input
          type="number"
          min="0"
          max="100"
          step="1"
          disabled={disabled}
          className="max-w-[4rem] tabular-nums text-center"
          value={localValue}
          onChange={async (e) => {
            const newProgress = parseInt(e.target.value, 10);

            if (
              Number.isNaN(newProgress) ||
              newProgress < 0 ||
              newProgress > 100
            ) {
              return toast.error("Voer een getal in van 0 tot 100.");
            }

            setLocalValue(newProgress); // Update local state immediately for responsive UI
            await debouncedSetCompleted(newProgress); // Debounced API call
          }}
        />
        {children}
      </Field>
    );
  }

  return (
    <CheckboxField disabled={disabled}>
      <Checkbox
        checked={value > 0}
        indeterminate={indeterminate}
        onChange={(checked) => setCompleted(checked ? 100 : 0)}
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
  const { showRequirements } = useCourseCardSettings();
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

                <CheckboxField
                  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                  disabled={disabled || areAllCompetenciesCompleted}
                >
                  <Checkbox
                    checked={
                      areAllCompetenciesCompleted || areSomeCompetenciesSelected
                    }
                    indeterminate={!areAllCompetenciesSelected}
                    onChange={async (checked) => {
                      setOptimisticProgress(
                        module.competencies.map((competency) => ({
                          id: competency.id,
                          progress: checked ? 100 : 0,
                        })),
                      );

                      await updateBulkCompetencyProgress({
                        cohortAllocationId,
                        progressData: module.competencies.map((competency) => ({
                          competencyId: competency.id,
                          progress: checked ? 100 : 0,
                        })),
                      }).catch(() => {
                        toast.error("Er is iets misgegaan.");
                      });

                      return;
                    }}
                  />
                  <div className="flex gap-x-2">
                    <Weight weight={module.weight} />
                    <Label>
                      <Strong>{module.title}</Strong>
                    </Label>
                  </div>
                </CheckboxField>
              </div>
              <div className="flex items-center justify-end gap-x-2">
                <ModuleRequiredBadge
                  type={module.isRequired ? "required" : "not-required"}
                />
                {/* <CompetencyTypeBadge type={module.type} /> */}
              </div>
            </div>

            <DisclosurePanel className="mt-2 pl-[52px] sm:pl-11">
              {/* <div className="flex">
                <SwitchField>
                  <Label>Toon eisen</Label>
                  <Switch
                    checked={showRequirements}
                    onChange={setShowRequirements}
                  />
                </SwitchField>
              </div> */}

              <dl className="space-y-1 mt-4">
                {module.competencies.map((competency) => {
                  const isCompletedInPreviousCertification =
                    completedCompetencies.includes(competency.id);

                  const competencyProgress =
                    optimisticProgress.find((cp) => cp.id === competency.id)
                      ?.progress ?? 0;

                  return (
                    <ProgressInput
                      key={competency.id}
                      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                      disabled={disabled || isCompletedInPreviousCertification}
                      value={
                        isCompletedInPreviousCertification
                          ? 100
                          : competencyProgress
                      }
                      indeterminate={
                        !isCompletedInPreviousCertification &&
                        competencyProgress > 0 &&
                        competencyProgress < 100
                      }
                      setCompleted={async (newProgress) => {
                        setOptimisticProgress([
                          {
                            id: competency.id,
                            progress: newProgress,
                          },
                        ]);

                        await updateSingleCompetencyProgress({
                          cohortAllocationId,
                          competencyId: competency.id,
                          progress: newProgress,
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
                    </ProgressInput>
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
