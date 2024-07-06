"use server";

import {
  addStudentToCohortByPersonId as addStudentToCohortByPersonIdInner,
  claimStudentsInCohort as claimStudentsInCohortInner,
  enrollStudentsInCurriculumForCohort as enrollStudentsInCurriculumForCohortInner,
  getUserOrThrow,
  isInstructorInCohort as isInstructorInCohortInner,
  listCountries as listCountriesInner,
  listCurriculaByProgram as listCurriculaByProgramInner,
  listGearTypesByCurriculum as listGearTypesByCurriculumInner,
  listPersonsForLocationByRole as listPersonsForLocationByRoleInner,
  listPrograms as listProgramsInner,
  type ActorType,
} from "~/lib/nwd";

// Export all as async functions
export async function claimStudentsInCohort(
  cohortId: string,
  studentIds: string[],
) {
  await getUserOrThrow();

  return claimStudentsInCohortInner(cohortId, studentIds);
}

export async function enrollStudentsInCurriculumForCohort(props: {
  cohortId: string;
  curriculumId: string;
  gearTypeId: string;
  students: {
    allocationId: string;
    personId: string;
  }[];
}) {
  await getUserOrThrow();

  return enrollStudentsInCurriculumForCohortInner(props);
}

export async function isInstructorInCohort(cohortId: string) {
  await getUserOrThrow();

  return isInstructorInCohortInner(cohortId);
}

export async function listCurriculaByProgram(
  programId: string,
  onlyActive?: boolean,
) {
  await getUserOrThrow();

  return listCurriculaByProgramInner(programId, onlyActive);
}

export async function listGearTypesByCurriculum(curriculumId: string) {
  await getUserOrThrow();

  return listGearTypesByCurriculumInner(curriculumId);
}

export async function listPrograms() {
  await getUserOrThrow();

  return listProgramsInner();
}

export async function addStudentToCohortByPersonId(props: {
  cohortId: string;
  locationId: string;
  personId: string;
}) {
  await getUserOrThrow();

  return addStudentToCohortByPersonIdInner(props);
}

export async function listCountries() {
  await getUserOrThrow();

  return listCountriesInner();
}

export async function listPersonsForLocationByRole(
  locationId: string,
  role: ActorType,
) {
  await getUserOrThrow();

  return listPersonsForLocationByRoleInner(locationId, role);
}
