import { notFound } from "next/navigation";
import React from "react";
import {
    CompetencyTypeBadge,
    ModuleRequiredBadge,
} from "~/app/(dashboard)/_components/badges";
import {
    Checkbox,
    CheckboxField,
    CheckboxGroup,
} from "~/app/(dashboard)/_components/checkbox";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Label } from "~/app/(dashboard)/_components/fieldset";
import { Strong } from "~/app/(dashboard)/_components/text";
import { Weight } from "~/app/_components/weight";
import {
    listCompetencyProgressInCohortForStudent,
    listCompletedCompetenciesByStudentCurriculumId,
    retrieveCurriculumById,
    retrieveStudentAllocationWithCurriculum,
} from "~/lib/nwd";

export async function CourseCard({
  cohortAllocationId,
  cohortId,
}: {
  cohortAllocationId: string;
  cohortId: string;
}) {
  const allocation = await retrieveStudentAllocationWithCurriculum(
    cohortId,
    cohortAllocationId,
  );

  if (!allocation) {
    return notFound();
  }

  if (!allocation.studentCurriculum) {
    return "Nog geen curriculum toegekend";
  }

  const [curriculum, completedCompetencies, allCompetencyProgress] =
    await Promise.all([
      retrieveCurriculumById(allocation.studentCurriculum.curriculumId),
      listCompletedCompetenciesByStudentCurriculumId(
        allocation.studentCurriculum.id,
      ),
      listCompetencyProgressInCohortForStudent(cohortAllocationId),
    ]);

  if (!curriculum) {
    throw new Error("Failed to retrieve curriculum");
  }

  return (
    <div>
      {curriculum.modules.map((module, index) => {
        const completedCompetencyIds = new Set(
          completedCompetencies.map((cc) => cc.competencyId),
        );
        const competencyProgressMap = new Map(
          allCompetencyProgress.map((cp) => [
            cp.competencyId,
            Number(cp.progress),
          ]),
        );

        const areAllCompetenciesCompleted = module.competencies.every(
          (competency) => completedCompetencyIds.has(competency.id),
        );

        const areSomeCompetenciesSelected = module.competencies.some(
          (competency) =>
            completedCompetencyIds.has(competency.id) ||
            (competencyProgressMap.has(competency.id) &&
              competencyProgressMap.get(competency.id)! > 0),
        );

        const areAllCompetenciesSelected = module.competencies.every(
          (competency) =>
            completedCompetencyIds.has(competency.id) ||
            (competencyProgressMap.has(competency.id) &&
              competencyProgressMap.get(competency.id)! >= 100),
        );

        return (
          <React.Fragment key={module.id}>
            <CheckboxGroup role="group">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-x-2">
                  <div className="flex-shrink-0 w-12">
                    <Weight weight={module.weight} />
                  </div>
                  <CheckboxField disabled={areAllCompetenciesCompleted}>
                    <Checkbox
                      checked={
                        areAllCompetenciesCompleted ||
                        areSomeCompetenciesSelected
                      }
                      indeterminate={!areAllCompetenciesSelected}
                    />
                    <Label>
                      <Strong>{module.title}</Strong>
                    </Label>
                  </CheckboxField>
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
                    completedCompetencyIds.has(competency.id);

                  const competencyProgress =
                    competencyProgressMap.get(competency.id) ?? 0;

                  return (
                    <div key={competency.id} className="flex gap-x-2">
                      <div className="flex-shrink-0 w-12">
                        <Weight weight={competency.weight} />
                      </div>
                      <CheckboxField
                        disabled={isCompletedInPreviousCertification}
                      >
                        <Checkbox
                          checked={
                            isCompletedInPreviousCertification ||
                            competencyProgress > 0
                          }
                          indeterminate={
                            !isCompletedInPreviousCertification &&
                            competencyProgress > 0 &&
                            competencyProgress < 100
                          }
                        />
                        <Label>{competency.title}</Label>
                      </CheckboxField>
                    </div>
                  );
                })}
              </dl>
            </CheckboxGroup>

            {index < curriculum.modules.length - 1 ? (
              <Divider soft className="my-6" />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
