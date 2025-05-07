import { notFound } from "next/navigation";
import { createLoader, parseAsString } from "nuqs/server";
import {
  listInstructorsByCohortId,
  listPersonsForLocationWithPagination,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { AddInstructor } from "./_components/add-instructor";
import StudentsTable from "./_components/instructors-table";

const searchParamsParser = createLoader({
  query: parseAsString.withDefault(""),
});

export default async function Page(props: {
  params: Promise<{ location: string; cohort: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const location = await retrieveLocationByHandle(params.location);

  const { query } = searchParamsParser(searchParams);

  const cohortPromise = retrieveCohortByHandle(params.cohort, location.id).then(
    (cohort) => {
      if (!cohort) {
        notFound();
      }
      return cohort;
    },
  );

  const [cohort, instructors, searchedInstructors] = await Promise.all([
    cohortPromise,
    cohortPromise.then((cohort) => listInstructorsByCohortId(cohort.id)),
    listPersonsForLocationWithPagination(location.id, {
      filter: {
        actorType: "instructor",
        q: query,
      },
      limit: 25,
    }),
  ]);

  return (
    <div className="max-w-4xl">
      <AddInstructor
        searchedInstructors={searchedInstructors.items.filter(
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
