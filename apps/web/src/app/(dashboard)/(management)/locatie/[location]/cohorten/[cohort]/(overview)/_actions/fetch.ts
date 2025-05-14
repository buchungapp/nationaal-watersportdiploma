"use server";
import {
  type ActorType,
  getUserOrThrow,
  isInstructorInCohort as isInstructorInCohortInner,
  listCountries as listCountriesInner,
  listCurriculaByProgram as listCurriculaByProgramInner,
  listDistinctTagsForCohort as listDistinctTagsForCohortInner,
  listGearTypesByCurriculumForLocation as listGearTypesByCurriculumForLocationInner,
  listInstructorsByCohortId,
  listPersonsForLocationByRole as listPersonsForLocationByRoleInner,
  listPrivilegesForCohort as listPrivilegesForCohortInner,
  listPrograms as listProgramsInner,
} from "~/lib/nwd";

export async function isInstructorInCohort(cohortId: string) {
  return isInstructorInCohortInner(cohortId);
}

export async function listCurriculaByProgram(
  programId: string,
  onlyActive?: boolean,
) {
  await getUserOrThrow();

  return listCurriculaByProgramInner(programId, onlyActive);
}

export async function listGearTypesByCurriculumForLocation(
  locationId: string,
  curriculumId: string,
) {
  await getUserOrThrow();

  return listGearTypesByCurriculumForLocationInner(locationId, curriculumId);
}

export async function listPrograms() {
  await getUserOrThrow();

  return listProgramsInner();
}

export async function listPrivilegesForCohort(cohortId: string) {
  return listPrivilegesForCohortInner(cohortId);
}

export async function listInstructorsInCohort(cohortId: string) {
  return listInstructorsByCohortId(cohortId);
}

export async function listDistinctTagsForCohort(cohortId: string) {
  return listDistinctTagsForCohortInner(cohortId);
}

export async function listCountries() {
  await getUserOrThrow();

  return listCountriesInner();
}

export async function listPersonsForLocationByRole(
  locationId: string,
  role: ActorType,
) {
  return listPersonsForLocationByRoleInner(locationId, role);
}
