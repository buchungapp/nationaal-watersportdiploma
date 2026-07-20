"use server";

import {
  listCompletedCompetenciesByStudentCurriculumId,
  listCurriculaByPersonId,
  listCurriculaByProgram,
  listGearTypesByCurriculumForLocation,
} from "~/lib/nwd";

export async function getCurriculaByProgram(programId: string) {
  return await listCurriculaByProgram(programId, true);
}

export async function getGearTypesByCurriculumForLocation(
  locationId: string,
  curriculumId: string,
) {
  return await listGearTypesByCurriculumForLocation(locationId, curriculumId);
}

export async function getExistingStudentCurriculumProgress(
  personId: string,
  curriculumId: string,
  gearTypeId: string,
): Promise<{
  studentCurriculumId: string;
  completedCompetencyIds: string[];
} | null> {
  const curricula = await listCurriculaByPersonId(personId);

  const match = curricula.find(
    (row) =>
      row.curriculum.id === curriculumId && row.gearType.id === gearTypeId,
  );

  if (!match) {
    return null;
  }

  const completed = await listCompletedCompetenciesByStudentCurriculumId(
    match.id,
  );

  return {
    studentCurriculumId: match.id,
    completedCompetencyIds: completed.map((row) => row.competencyId),
  };
}
