import { notFound } from "next/navigation";
import {
  getCohortByHandle,
  listStudentsWithCurriculaByCohortId,
} from "~/lib/nwd";
import StudentsTable from "./_components/students-table";

export default async function Page({
  params,
}: {
  params: { location: string; cohort: string };
}) {
  const cohort = await getCohortByHandle(params.cohort);
  if (!cohort) {
    notFound();
  }
  const students = await listStudentsWithCurriculaByCohortId(cohort.id);

  return (
    <>
      <StudentsTable students={students} totalItems={students.length} />
    </>
  );
}
