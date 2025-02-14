"use client";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { MinusIcon, PlusIcon } from "@heroicons/react/16/solid";
import type { PropsWithChildren } from "react";
import { ModuleRequiredBadge } from "~/app/(dashboard)/_components/badges";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
  CheckboxGroup,
} from "~/app/(dashboard)/_components/checkbox";
import { Description, Label } from "~/app/(dashboard)/_components/fieldset";
import { Strong } from "~/app/(dashboard)/_components/text";
import { Weight } from "~/app/_components/weight";
import type { retrieveCurriculumById } from "~/lib/nwd";

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
  setCompleted?: (completed: boolean) => Promise<void>;
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
  const areAllCompetenciesCompleted = module.competencies.every((competency) =>
    completedCompetencies.includes(competency.id),
  );

  const areSomeCompetenciesSelected = module.competencies.some(
    (competency) =>
      completedCompetencies.includes(competency.id) ||
      (competenciesProgress.find((cp) => cp.id === competency.id)?.progress ??
        0) > 0,
  );

  const areAllCompetenciesSelected = module.competencies.every(
    (competency) =>
      completedCompetencies.includes(competency.id) ||
      (competenciesProgress.find((cp) => cp.id === competency.id)?.progress ??
        0) >= 100,
  );

  return (
    <Disclosure>
      {({ open: panelOpen }) => (
        <>
          {/* biome-ignore lint/a11y/useSemanticElements: <explanation> */}
          <CheckboxGroup role="group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-2">
                <DisclosureButton as={Button} plain>
                  {panelOpen ? <MinusIcon /> : <PlusIcon />}
                </DisclosureButton>

                <CourseCardCheckbox
                  disabled={areAllCompetenciesCompleted}
                  checked={
                    areAllCompetenciesCompleted || areSomeCompetenciesSelected
                  }
                  indeterminate={!areAllCompetenciesSelected}
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
              <dl className="space-y-1">
                {module.competencies.map((competency) => {
                  const isCompletedInPreviousCertification =
                    completedCompetencies.includes(competency.id);

                  const competencyProgress =
                    competenciesProgress.find((cp) => cp.id === competency.id)
                      ?.progress ?? 0;

                  return (
                    <CourseCardCheckbox
                      key={competency.id}
                      disabled={isCompletedInPreviousCertification}
                      checked={
                        isCompletedInPreviousCertification ||
                        competencyProgress > 0
                      }
                      indeterminate={
                        !isCompletedInPreviousCertification &&
                        competencyProgress > 0 &&
                        competencyProgress < 100
                      }
                    >
                      <div className="flex gap-x-2">
                        <Weight weight={competency.weight} />
                        <Label>{competency.title}</Label>
                      </div>
                      <Description className="text-justify">
                        {competency.requirement}
                      </Description>
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
