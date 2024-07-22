import { PlusIcon } from "@heroicons/react/16/solid";
import FlexSearch from "flexsearch";

import { notFound } from "next/navigation";
import { createSearchParamsCache, parseAsStringLiteral } from "nuqs/server";
import { Suspense } from "react";
import { SWRConfig, unstable_serialize } from "swr";
import Search from "~/app/(dashboard)/(management)/_components/search";
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import { TextLink } from "~/app/(dashboard)/_components/text";
import {
  isInstructorInCohort,
  listCountries,
  listDistinctTagsForCohort,
  listInstructorsByCohortId,
  listPersonsForLocationByRole,
  listPrivilegesForCohort,
  listPrograms,
  listRolesForLocation,
  listStudentsWithCurriculaByCohortId,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import {
  DialogButtons,
  DialogWrapper,
  Dialogs,
} from "./_components/dialog-context";
import { SetView } from "./_components/filters";
import StudentsTable from "./_components/students-table";

async function QuickActionButtons({
  locationId,
}: {
  cohortId: string;
  locationId: string;
}) {
  const [roles] = await Promise.all([listRolesForLocation(locationId)]);

  if (!roles.includes("location_admin")) {
    return null;
  }

  return (
    <Dropdown>
      <DropdownButton color="branding-orange">
        <PlusIcon />
        Cursist toevoegen
      </DropdownButton>
      <DropdownMenu>
        <DialogButtons />
      </DropdownMenu>
    </Dropdown>
  );
}

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

  const [cohort, students, location, instructorAllocation, permissions] =
    await Promise.all([
      cohortPromise,
      cohortPromise.then((cohort) =>
        listStudentsWithCurriculaByCohortId(cohort.id),
      ),
      retrieveLocationByHandle(params.location),
      cohortPromise.then((cohort) => isInstructorInCohort(cohort.id)),
      cohortPromise.then((cohort) => listPrivilegesForCohort(cohort.id)),
    ]);

  const isCohortAdmin = permissions.length > 0;
  const defaultView =
    !!instructorAllocation && !isCohortAdmin ? "geclaimd" : "allen";

  const parsedParams = createSearchParamsCache({
    overzicht: parseAsStringLiteral(["allen", "geclaimd"] as const).withDefault(
      defaultView,
    ),
  }).parse(searchParams);

  let filteredStudents = students;

  if (parsedParams.overzicht === "geclaimd" && !!instructorAllocation) {
    filteredStudents = students.filter(
      (student) => student.instructor?.id === instructorAllocation.personId,
    );
  }

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
        { field: "course", tokenize: "full" },
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
      course: student.studentCurriculum?.course.title,
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
    const searchResult = index.search(decodeURIComponent(searchQuery));

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
          countries: listCountries(),
          [unstable_serialize([`allStudents`, location.id])]:
            listPersonsForLocationByRole(location.id, "student"),
          [unstable_serialize(["allInstructorsInCohort", cohort.id])]:
            listInstructorsByCohortId(cohort.id),
          [unstable_serialize(["isInstructorInCohort", cohort.id])]:
            isInstructorInCohort(cohort.id),
          [unstable_serialize(["permissionsInCohort", cohort.id])]:
            listPrivilegesForCohort(cohort.id),
          [unstable_serialize(["locationRoles", location.id])]:
            listRolesForLocation(location.id),
          [unstable_serialize(["distinctTagsForCohort", cohort.id])]:
            listDistinctTagsForCohort(cohort.id),
          allPrograms: listPrograms(),
        },
      }}
    >
      <DialogWrapper>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-sm:w-full sm:flex-1">
            <div className="mt-4 flex gap-4">
              <div className="w-full max-w-xl">
                <Search placeholder="Zoek cursisten op naam, instructeur of tag" />
              </div>

              {!!instructorAllocation ? (
                <div className="shrink-0">
                  <SetView defaultView={defaultView}>
                    <option value="allen">Alle cursisten</option>
                    <option value="geclaimd">Mijn cursisten</option>
                  </SetView>
                </div>
              ) : null}
            </div>
          </div>
          <Suspense fallback={null}>
            <QuickActionButtons locationId={location.id} cohortId={cohort.id} />
          </Suspense>
        </div>

        <StudentsTable
          students={searchedStudents}
          totalItems={searchedStudents.length}
          cohortId={cohort.id}
          // TODO: this can be optimized
          locationRoles={await listRolesForLocation(location.id)}
          noOptionsLabel={
            parsedParams.overzicht === "allen" ? (
              "Dit cohort heeft nog geen cursisten"
            ) : (
              <span>
                Je hebt nog geen cursisten geclaimd.{" "}
                <TextLink
                  href={`/locatie/${params.location}/cohorten/${params.cohort}?view=all`}
                >
                  Bekijk allene cursisten
                </TextLink>
                .
              </span>
            )
          }
        />

        <Dialogs locationId={location.id} cohortId={cohort.id} />
      </DialogWrapper>
    </SWRConfig>
  );
}
