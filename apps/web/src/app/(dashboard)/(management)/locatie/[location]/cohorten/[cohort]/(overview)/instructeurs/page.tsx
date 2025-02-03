import { notFound } from "next/navigation";
import {
  listInstructorsByCohortId,
  listPersonsForLocationByRole,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { AddInstructor } from "./_components/add-instructor";
import StudentsTable from "./_components/instructors-table";

export default async function Page(
  props: {
    params: Promise<{ location: string; cohort: string }>;
  }
) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);

  const cohortPromise = retrieveCohortByHandle(params.cohort, location.id).then(
    (cohort) => {
      if (!cohort) {
        notFound();
      }
      return cohort;
    },
  );

  const [cohort, instructors, allInstructors] = await Promise.all([
    cohortPromise,
    cohortPromise.then((cohort) => listInstructorsByCohortId(cohort.id)),
    listPersonsForLocationByRole(location.id, "instructor"),
  ]);

  return (
    <div className="max-w-4xl">
      <AddInstructor
        allInstructors={allInstructors.filter(
          (instructor) =>
            !instructors.some((i) => i.person.id === instructor.id),
        )}
        cohortId={cohort.id}
        locationId={location.id}
      />
      <StudentsTable
        instructors={instructors}
        totalItems={instructors.length}
        cohortId={cohort.id}
        locationId={location.id}
      />
    </div>
  );
}
