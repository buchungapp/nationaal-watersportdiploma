"use server";

import { revalidatePath } from "next/cache";
import {
  type ActorType,
  addCohortRole as addCohortRoleInner,
  addInstructorToCohortByPersonId as addInstructorToCohortByPersonIdInner,
  completeAllCoreCompetencies as completeAllCoreCompetenciesInner,
  getUserOrThrow,
  isInstructorInCohort as isInstructorInCohortInner,
  listCountries as listCountriesInner,
  listCurriculaByProgram as listCurriculaByProgramInner,
  listDistinctTagsForCohort as listDistinctTagsForCohortInner,
  listGearTypesByCurriculum as listGearTypesByCurriculumInner,
  listInstructorsByCohortId,
  listPersonsForLocationByRole as listPersonsForLocationByRoleInner,
  listPrivilegesForCohort as listPrivilegesForCohortInner,
  listPrograms as listProgramsInner,
  removeAllocationById,
  removeCohortRole as removeCohortRoleInner,
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

export async function listGearTypesByCurriculum(curriculumId: string) {
  await getUserOrThrow();

  return listGearTypesByCurriculumInner(curriculumId);
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
  revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
  revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");

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
  await addCohortRoleInner(props);

  revalidatePath("/locatie/[location]/cohorten/[cohort]/instructeurs", "page");

  return;
}

export async function removeCohortRole(props: {
  cohortId: string;
  allocationId: string;
  roleHandle: "cohort_admin";
}) {
  await removeCohortRoleInner(props);

  revalidatePath("/locatie/[location]/cohorten/[cohort]/instructeurs", "page");

  return;
}

export async function completeAllCoreCompetencies({
  cohortAllocationId,
}: {
  cohortAllocationId: string[];
}) {
  await completeAllCoreCompetenciesInner({
    cohortAllocationId,
  });

  revalidatePath(
    "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
    "page",
  );
  revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
}
