"use server";

import { revalidatePath } from "next/cache";
import {
  addCohortRole as addCohortRoleInner,
  addInstructorToCohortByPersonId as addInstructorToCohortByPersonIdInner,
  addStudentToCohortByPersonId as addStudentToCohortByPersonIdInner,
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
  setAllocationTags as setAllocationTagsInner,
  updateStudentInstructorAssignment,
  type ActorType,
} from "~/lib/nwd";

// Export all as async functions
export async function claimStudents(cohortId: string, studentIds: string[]) {
  await updateStudentInstructorAssignment({
    cohortId,
    studentAllocationIds: studentIds,
    action: "claim",
  });
  revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
  revalidatePath(
    "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
    "page",
  );
}

// Export all as async functions
export async function releaseStudent(cohortId: string, studentIds: string[]) {
  await updateStudentInstructorAssignment({
    cohortId,
    studentAllocationIds: studentIds,
    action: "release",
  });
  revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
  revalidatePath(
    "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
    "page",
  );
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
  await enrollStudentsInCurriculumForCohortInner(props);
  revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
  revalidatePath(
    "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
    "page",
  );
}

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

export async function addStudentToCohortByPersonId(props: {
  cohortId: string;
  locationId: string;
  personId: string;
  tags?: string[];
}) {
  const result = await addStudentToCohortByPersonIdInner(props);
  revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
  return result;
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

export async function setTags(props: {
  cohortId: string;
  allocationId: string;
  tags: string[];
}) {
  await setAllocationTagsInner(props);

  revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
  revalidatePath(
    "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
    "page",
  );

  return;
}
