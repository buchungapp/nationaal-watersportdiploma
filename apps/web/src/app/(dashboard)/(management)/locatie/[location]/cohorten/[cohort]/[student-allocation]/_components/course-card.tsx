import { notFound } from "next/navigation";
import React from "react";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { TextLink } from "~/app/(dashboard)/_components/text";
import {
  listCompetencyProgressInCohortForStudent,
  listCompletedCompetenciesByStudentCurriculumId,
  retrieveCurriculumById,
  retrieveStudentAllocationWithCurriculum,
} from "~/lib/nwd";
import { StartStudentCurriculum } from "./start-curriculum";
import { CompleteAllCoreModules, Module } from "./student-module";

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
    return (
      <StartStudentCurriculum
        allocationId={cohortAllocationId}
        cohortId={cohortId}
        personId={allocation.person.id}
      />
    );
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

  const completedCompetencyIds = completedCompetencies.map(
    (cc) => cc.competencyId,
  );

  const competencyProgressMap = allCompetencyProgress.map((cp) => ({
    id: cp.competencyId,
    progress: Number(cp.progress),
  }));

  return (
    <div>
      <DescriptionList>
        <DescriptionTerm>Programma</DescriptionTerm>
        <DescriptionDetails>
          <TextLink
            href={`/diplomalijn/consument/disciplines/${allocation.studentCurriculum.discipline.handle}/${allocation.studentCurriculum.course.handle}`}
            target="_blank"
          >
            {allocation.studentCurriculum.program.title ??
              `${allocation.studentCurriculum.course.title} ${allocation.studentCurriculum.degree.title}`}
          </TextLink>
        </DescriptionDetails>

        <DescriptionTerm>Vaartuig</DescriptionTerm>
        <DescriptionDetails>
          {allocation.studentCurriculum.gearType.title}
        </DescriptionDetails>
      </DescriptionList>

      <div className="flex flex-wrap mt-2 gap-x-2 gap-y-2">
        <CompleteAllCoreModules
          cohortAllocationId={cohortAllocationId}
          competencyIds={curriculum.modules
            .filter((m) => m.isRequired)
            .flatMap((module) => module.competencies.map((c) => c.id))
            .filter((c) => {
              // Filter out if already in completedCompetencyIds or
              // if progress is >= 100 in competencyProgressMap
              const completed = completedCompetencyIds.includes(c);
              const progress = competencyProgressMap.find((cp) => cp.id === c);

              return !completed && (!progress || progress.progress < 100);
            })}
        />
      </div>

      <div className="mt-6">
        {curriculum.modules.map((module, index) => {
          return (
            <React.Fragment key={module.id}>
              <Module
                module={module}
                completedCompetencies={completedCompetencyIds}
                competenciesProgress={competencyProgressMap}
                cohortAllocationId={cohortAllocationId}
              />

              {index < curriculum.modules.length - 1 ? (
                <Divider soft className="my-2.5" />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
