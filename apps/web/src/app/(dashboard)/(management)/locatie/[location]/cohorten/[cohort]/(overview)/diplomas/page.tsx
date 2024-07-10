import FlexSearch from "flexsearch";

import { notFound } from "next/navigation";
import { SWRConfig, unstable_serialize } from "swr";
import Search from "~/app/(dashboard)/(management)/_components/search";
import {
  listCertificateOverviewByCohortId,
  listPrivilegesForCohort,
  listRolesForLocation,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
} from "~/lib/nwd";

import StudentsTable from "./_components/students-table";

export default async function Page({
  params,
  searchParams,
}: {
  params: { location: string; cohort: string };
  searchParams: Record<string, string | string[] | undefined>;
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

  const [cohort, students, location] = await Promise.all([
    cohortPromise,
    cohortPromise.then((cohort) =>
      listCertificateOverviewByCohortId(cohort.id),
    ),
    retrieveLocationByHandle(params.location),
  ]);

  const filteredStudents = students;

  const index = new FlexSearch.Document({
    tokenize: "forward",
    context: {
      resolution: 9,
      depth: 2,
      bidirectional: true,
    },
    document: {
      id: "id",
      index: [
        { field: "name", tokenize: "full" },
        { field: "tags", tokenize: "forward" },
        { field: "instructor", tokenize: "full" },
      ],
    },
  });

  // Add students to the index
  filteredStudents.forEach((student) => {
    index.add({
      id: student.id,
      name: [
        student.person.firstName,
        student.person.lastNamePrefix,
        student.person.lastName,
      ]
        .filter(Boolean)
        .join(" "),
      tags: student.tags || [],
      instructor: [
        student.instructor?.firstName,
        student.instructor?.lastNamePrefix,
        student.instructor?.lastName,
      ]
        .filter(Boolean)
        .join(" "),
    });
  });

  const searchQuery = searchParams?.query
    ? Array.isArray(searchParams.query)
      ? searchParams.query.join(" ")
      : searchParams.query
    : null;

  let searchedStudents = filteredStudents;

  if (searchQuery && searchQuery.length >= 2) {
    const searchResult = index.search(searchQuery);

    if (searchResult.length > 0) {
      searchedStudents = filteredStudents.filter((student) =>
        searchResult.flatMap(({ result }) => result).includes(student.id),
      );
    }
  }

  return (
    <SWRConfig
      value={{
        fallback: {
          // Note that there is no `await` here,
          // so it only blocks rendering of components that
          // actually rely on this data.
          [unstable_serialize(["permissionsInCohort", cohort.id])]:
            listPrivilegesForCohort(cohort.id),
          [unstable_serialize(["locationRoles", location.id])]:
            listRolesForLocation(location.id),
        },
      }}
    >
      <>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-sm:w-full sm:flex-1">
            <div className="mt-4 flex gap-4">
              <div className="w-full max-w-xl">
                <Search placeholder="Zoek cursisten op naam, instructeur of tag" />
              </div>
            </div>
          </div>
        </div>

        <StudentsTable
          students={searchedStudents}
          totalItems={searchedStudents.length}
          cohortId={cohort.id}
          // TODO: this can be optimized
          locationRoles={await listRolesForLocation(location.id)}
          noOptionsLabel="Dit cohort heeft nog geen cursisten"
        />
      </>
    </SWRConfig>
  );
}
