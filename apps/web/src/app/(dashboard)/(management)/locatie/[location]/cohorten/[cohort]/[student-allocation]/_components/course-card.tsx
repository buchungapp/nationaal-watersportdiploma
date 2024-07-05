import { notFound } from "next/navigation";
import React from "react";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  listCompetencyProgressInCohortForStudent,
  listCompletedCompetenciesByStudentCurriculumId,
  retrieveCurriculumById,
  retrieveStudentAllocationWithCurriculum,
} from "~/lib/nwd";
import { Module } from "./student-module";

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

  const completedCompetencyIds = completedCompetencies.map(
    (cc) => cc.competencyId,
  );

  const competencyProgressMap = allCompetencyProgress.map((cp) => ({
    id: cp.competencyId,
    progress: Number(cp.progress),
  }));

  return (
    <div>
      {curriculum.modules.map((module, index) => {
        return (
          <React.Fragment key={module.id}>
            <Module
              module={module}
              completedCompetencies={completedCompetencyIds}
              competenciesProgress={competencyProgressMap}
            />

            {index < curriculum.modules.length - 1 ? (
              <Divider soft className="my-6" />
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
