"use server";

import { revalidatePath } from "next/cache";
import {
  type ActorType,
  addCohortRole as addCohortRoleInner,
  addInstructorToCohortByPersonId as addInstructorToCohortByPersonIdInner,
  addStudentToCohortByPersonId as addStudentToCohortByPersonIdInner,
  completeAllCoreCompetencies as completeAllCoreCompetenciesInner,
  deleteCohort as deleteCohortInner,
  enrollStudentsInCurriculumForCohort as enrollStudentsInCurriculumForCohortInner,
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
  releaseStudentFromCohortByAllocationId as releaseStudentFromCohortByAllocationIdInner,
  removeAllocationById,
  removeCohortRole as removeCohortRoleInner,
  setAllocationTags as setAllocationTagsInner,
  updateCohortDetails,
  updateStudentInstructorAssignment,
  withdrawStudentFromCurriculumInCohort,
} from "~/lib/nwd";

export async function claimStudents(cohortId: string, studentIds: string[]) {
  await updateStudentInstructorAssignment({
    cohortId,
    studentAllocationIds: studentIds,
    action: "claim",
  });
  revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
  revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
  revalidatePath(
    "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
    "page",
  );
}

export async function releaseStudent(cohortId: string, studentIds: string[]) {
  await updateStudentInstructorAssignment({
    cohortId,
    studentAllocationIds: studentIds,
    action: "release",
  });
  revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
  revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
  revalidatePath(
    "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
    "page",
  );
}

export async function assignInstructorToStudents({
  cohortId,
  instructorPersonId,
  studentIds,
}: {
  cohortId: string;
  studentIds: string[];
  instructorPersonId: string | null;
}) {
  if (instructorPersonId) {
    await updateStudentInstructorAssignment({
      cohortId,
      studentAllocationIds: studentIds,
      action: "claim",
      instructorPersonId: instructorPersonId ?? undefined,
    });
  } else {
    await updateStudentInstructorAssignment({
      cohortId,
      studentAllocationIds: studentIds,
      action: "release",
    });
  }
  revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
  revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
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
  revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
  revalidatePath(
    "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
    "page",
  );
}

export async function withdrawStudentFromCurriculum(props: {
  allocationId: string;
}) {
  await withdrawStudentFromCurriculumInCohort(props);
  revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
  revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
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

export async function listPrivilegesForCohort(cohortId: string) {
  return listPrivilegesForCohortInner(cohortId);
}

export async function listInstructorsInCohort(cohortId: string) {
  return listInstructorsByCohortId(cohortId);
}

export async function listDistinctTagsForCohort(cohortId: string) {
  return listDistinctTagsForCohortInner(cohortId);
}

export async function addStudentToCohortByPersonId(props: {
  cohortId: string;
  locationId: string;
  personId: string;
  tags?: string[];
}) {
  const result = await addStudentToCohortByPersonIdInner(props);
  revalidatePath("/locatie/[location]/cohorten/[cohort]", "layout");
  return result;
}

export async function releaseStudentFromCohortByAllocationId(props: {
  locationId: string;
  cohortId: string;
  allocationId: string;
}) {
  const result = await releaseStudentFromCohortByAllocationIdInner(props);
  revalidatePath("/locatie/[location]/cohorten/[cohort]", "layout");
  revalidatePath(
    "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
    "page",
  );

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

export async function setTags(props: {
  cohortId: string;
  allocationId: string | string[];
  tags: string[];
}) {
  await setAllocationTagsInner(props);

  revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
  revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
  revalidatePath(
    "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
    "page",
  );

  return;
}

export async function updateCohort(props: {
  cohortId: string;
  label?: string;
  accessStartTimestamp?: string;
  accessEndTimestamp?: string;
}) {
  await updateCohortDetails(props);

  revalidatePath("/locatie/[location]/cohorten/", "page");
  revalidatePath("/locatie/[location]/cohorten/[cohort]", "layout");

  return;
}

export async function deleteCohort(props: { cohortId: string }) {
  await deleteCohortInner(props.cohortId);

  revalidatePath("/locatie/[location]/cohorten/", "page");
  revalidatePath("/locatie/[location]/cohorten/[cohort]", "layout");

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
