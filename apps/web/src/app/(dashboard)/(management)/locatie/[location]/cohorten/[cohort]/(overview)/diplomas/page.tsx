import FlexSearch from "flexsearch";

import { notFound } from "next/navigation";
import { SWRConfig } from "swr";
import Search from "~/app/(dashboard)/(management)/_components/search";
import {
  listCertificateOverviewByCohortId,
  retrieveCohortByHandle,
  retrieveDefaultCertificateVisibleFromDate,
  retrieveLocationByHandle,
} from "~/lib/nwd";

import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { FilterSelect } from "./_components/filter";
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

  const [cohort, students] = await Promise.all([
    cohortPromise,
    cohortPromise.then((cohort) =>
      listCertificateOverviewByCohortId(cohort.id),
    ),
  ]);

  const parsedSq = createSearchParamsCache({
    weergave: parseAsArrayOf(
      parseAsStringLiteral([
        "uitgegeven",
        "klaar-voor-uitgifte",
        "geen-voortgang",
      ] as const),
    ),
    query: parseAsString,
    selectie: parseAsArrayOf(parseAsString),
  }).parse(searchParams);

  const filteredStudents =
    parsedSq.weergave && parsedSq.weergave.length > 0
      ? students.filter((student) => {
          if (!parsedSq.weergave) {
            throw new Error("Unexpected missing parsedSq.weergave");
          }

          const isIssued = !!student.certificate;
          const isReady =
            student.studentCurriculum?.moduleStatus.some(
              (module) => module.uncompletedCompetencies < 1,
            ) ?? false;

          return (
            (parsedSq.weergave.includes("uitgegeven") && isIssued) ||
            (parsedSq.weergave.includes("klaar-voor-uitgifte") &&
              !isIssued &&
              isReady) ||
            (parsedSq.weergave.includes("geen-voortgang") &&
              !isIssued &&
              !isReady)
          );
        })
      : students;

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
        { field: "gearType", tokenize: "forward" },
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
      gearType: student.studentCurriculum?.gearType.title,
    });
  });

  const searchQuery = parsedSq.query;

  let searchedStudents = filteredStudents;

  if (searchQuery && searchQuery.length >= 2) {
    const searchResult = index.search(decodeURIComponent(searchQuery));

    if (searchResult.length > 0) {
      searchedStudents = filteredStudents.filter((student) =>
        searchResult.flatMap(({ result }) => result).includes(student.id),
      );
    } else {
      searchedStudents = [];
    }
  }

  // Add selection back to students
  const selectedStudents =
    parsedSq.selectie
      ?.filter((id) => !searchedStudents.some((x) => x.id === id))
      .map((id) => students.find((student) => student.id === id)!)
      .filter(Boolean) ?? [];

  return (
    <SWRConfig
      value={{
        fallback: {},
      }}
    >
      <>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-sm:w-full sm:flex-1">
            <div className="mt-4 flex max-w-xl gap-4">
              <Search placeholder="Zoek cursisten op naam, cursus, instructeur of tag" />

              <FilterSelect />
            </div>
          </div>
        </div>

        <StudentsTable
          progressTrackingEnabled={params.location === "krekt-sailing"}
          students={searchedStudents}
          selectedStudents={selectedStudents}
          totalItems={searchedStudents.length}
          cohortId={cohort.id}
          // TODO: this can be optimized
          defaultCertificateVisibleFromDate={
            (await retrieveDefaultCertificateVisibleFromDate(cohort.id)) ??
            undefined
          }
          noOptionsLabel={
            parsedSq.query && parsedSq.query.length > 2
              ? "Geen resultaten gevonden"
              : "Dit cohort heeft nog geen cursisten"
          }
        />
      </>
    </SWRConfig>
  );
}
