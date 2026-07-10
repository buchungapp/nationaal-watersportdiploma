import { notFound } from "next/navigation";
import { createLoader, parseAsString } from "nuqs/server";
import {
  listInstructorsByCohortId,
  listPersonsForLocationWithPagination,
  listRolesForLocation,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { ExportInstructorsDialog } from "../_components/download/export-instructors-dialog";
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

  const [cohort, instructors, searchedInstructors, locationRoles] =
    await Promise.all([
      cohortPromise,
      cohortPromise.then((cohort) => listInstructorsByCohortId(cohort.id)),
      listPersonsForLocationWithPagination(location.id, {
        filter: {
          actorType: "instructor",
          q: query,
        },
        limit: 25,
      }),
      listRolesForLocation(location.id),
    ]);

  return (
    <div className="max-w-4xl">
      <div className="flex sm:flex-row flex-col sm:justify-between items-start sm:items-end gap-1">
        <AddInstructor
          searchedInstructors={searchedInstructors.items.filter(
            (instructor) =>
              !instructors.some((i) => i.person.id === instructor.id),
          )}
          cohortId={cohort.id}
          locationId={location.id}
        />
        {locationRoles.includes("location_admin") ? (
          <div className="flex items-center gap-1 sm:shrink-0">
            <ExportInstructorsDialog
              cohortId={cohort.id}
              cohortLabel={cohort.label}
            />
          </div>
        ) : null}
      </div>
      <StudentsTable
        instructors={instructors}
        totalItems={instructors.length}
        cohortId={cohort.id}
        locationId={location.id}
      />
    </div>
  );
}
