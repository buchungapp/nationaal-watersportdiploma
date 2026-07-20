"use server";

import {
  getStudentCurriculumProgressForLocation,
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
  locationId: string,
  personId: string,
  curriculumId: string,
  gearTypeId: string,
) {
  return await getStudentCurriculumProgressForLocation(
    locationId,
    personId,
    curriculumId,
    gearTypeId,
  );
}
