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
  const cohortPromise = retrieveLocationByHandle(params.location).then(
    (location) =>
      retrieveCohortByHandle(params.cohort, location.id).then((cohort) => {
        if (!cohort) {
          notFound();
        }
        return cohort;
      }),
  );

  const [cohort, students] = await Promise.all([
    cohortPromise,
    cohortPromise.then((cohort) =>
      listStudentsWithCurriculaByCohortId(cohort.id),
    ),
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
