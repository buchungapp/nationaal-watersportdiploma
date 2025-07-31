"use server";
import {
  type LocationActorType,
  getUserOrThrow,
  isInstructorInCohort as isInstructorInCohortInner,
  listCountries as listCountriesInner,
  listCurriculaByProgram as listCurriculaByProgramInner,
  listDistinctTagsForCohort as listDistinctTagsForCohortInner,
  listGearTypesByCurriculumForLocation as listGearTypesByCurriculumForLocationInner,
  listInstructorsByCohortId,
  listPersonsForLocationByRole as listPersonsForLocationByRoleInner,
  listPrivilegesForCohort as listPrivilegesForCohortInner,
  listProgramsForLocation as listProgramsForLocationInner,
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

export async function listProgramsForLocation(locationId: string) {
  await getUserOrThrow();

  return listProgramsForLocationInner(locationId);
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
  role: LocationActorType,
) {
  return listPersonsForLocationByRoleInner(locationId, role);
}
