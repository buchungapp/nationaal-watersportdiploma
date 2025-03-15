"use server";

import {
  listCompletedCompetenciesByStudentCurriculumId,
  listCurriculaByProgram,
  listGearTypesByCurriculum,
  retrieveStudentCurriculumByPersonIdAndCurriculumId,
} from "~/lib/nwd";

export async function getCurriculaByProgram(programId: string) {
  return await listCurriculaByProgram(programId, true);
}

export async function getGearTypesByCurriculum(curriculumId: string) {
  return await listGearTypesByCurriculum(curriculumId);
}

export async function getCompletedCompetencies(
  personId: string,
  curriculumId: string,
  gearTypeId: string,
) {
  const studentCurriculum =
    await retrieveStudentCurriculumByPersonIdAndCurriculumId(
      personId,
      curriculumId,
      gearTypeId,
    );

  if (!studentCurriculum) {
    return null;
  }

  const completedCompetencies =
    await listCompletedCompetenciesByStudentCurriculumId(studentCurriculum.id);

  return completedCompetencies.map((cc) => cc.competencyId);
}
