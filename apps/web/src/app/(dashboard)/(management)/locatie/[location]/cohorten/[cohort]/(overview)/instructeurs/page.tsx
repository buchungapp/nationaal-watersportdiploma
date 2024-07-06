import { notFound } from "next/navigation";
import {
  listStudentsWithCurriculaByCohortId,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import StudentsTable from "./_components/instructors-table";

export default async function Page({
  params,
}: {
  params: { location: string; cohort: string };
}) {
  const cohortPromise = retrieveCohortByHandle(params.cohort).then((cohort) => {
    if (!cohort) {
      notFound();
    }
    return cohort;
  });

  const [cohort, students, location] = await Promise.all([
    cohortPromise,
    cohortPromise.then((cohort) =>
      listStudentsWithCurriculaByCohortId(cohort.id),
    ),
    retrieveLocationByHandle(params.location),
    ,
  ]);

  return (
    <StudentsTable
      students={students}
      totalItems={students.length}
      cohortId={cohort.id}
    />
  );
}
