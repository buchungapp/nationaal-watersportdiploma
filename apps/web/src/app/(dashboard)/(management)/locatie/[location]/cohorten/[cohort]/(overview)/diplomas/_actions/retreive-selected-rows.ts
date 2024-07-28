"use server";

import { listCertificateOverviewByCohortId } from "~/lib/nwd";

export async function retreiveSelectedRows(
  cohortId: string,
  selection: string[],
) {
  const students = await listCertificateOverviewByCohortId(cohortId);
  const selectedStudents = students.filter((student) =>
    selection.includes(student.id),
  );

  if (selectedStudents.length !== selection.length) {
    throw new Error("Not all selected students were found");
  }

  return selectedStudents;
}
