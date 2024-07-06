"use server";

import { revalidatePath } from "next/cache";
import {
  addCohortRole as addCohortRoleInner,
  addInstructorToCohortByPersonId as addInstructorToCohortByPersonIdInner,
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
  removeAllocationById,
  removeCohortRole as removeCohortRoleInner,
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
  return addStudentToCohortByPersonIdInner(props);
}

export async function addInstructorToCohortByPersonId(props: {
  cohortId: string;
  locationId: string;
  personId: string;
}) {
  const result = addInstructorToCohortByPersonIdInner(props);

  revalidatePath("/locatie/[location]/cohorten/[cohort]/instructeurs", "page");

  return result;
}

export async function removeAllocation(input: {
  locationId: string;
  allocationId: string;
  cohortId: string;
}) {
  await removeAllocationById(input);

  revalidatePath("/locatie/[location]/cohorten/[cohort]/instructeurs", "page");
  revalidatePath("/locatie/[location]/cohorten/[cohort]/cursisten", "page");

  return;
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

export async function addCohortRole(props: {
  cohortId: string;
  allocationId: string;
  roleHandle: "cohort_admin";
}) {
  addCohortRoleInner(props);

  revalidatePath("/locatie/[location]/cohorten/[cohort]/instructeurs", "page");

  return;
}

export async function removeCohortRole(props: {
  cohortId: string;
  allocationId: string;
  roleHandle: "cohort_admin";
}) {
  removeCohortRoleInner(props);

  revalidatePath("/locatie/[location]/cohorten/[cohort]/instructeurs", "page");

  return;
}
