import FlexSearch from "flexsearch";

import { notFound } from "next/navigation";
import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import {
  listCertificateOverviewByCohortId,
  retrieveCohortByHandle,
  retrieveDefaultCertificateVisibleFromDate,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import StudentsTable from "./_components/students-table";

const searchParamsParser = createLoader({
  weergave: parseAsArrayOf(
    parseAsStringLiteral([
      "uitgegeven",
      "klaar-voor-uitgifte",
      "geblokkeerd",
      "geen-voortgang",
    ] as const),
  ),
  query: parseAsString,
});

export default async function Page(props: {
  params: Promise<{ location: string; cohort: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;

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

  const parsedSq = searchParamsParser(searchParams);

  const filteredStudents =
    parsedSq.weergave && parsedSq.weergave.length > 0
      ? students.filter((student) => {
          if (!parsedSq.weergave) {
            throw new Error("Unexpected missing parsedSq.weergave");
          }

          // Classification (option d):
          //   uitgegeven       — diploma already issued for this allocation
          //   klaar-voor-uitgifte — at least one module would mint new
          //                       canonical content right now
          //   geblokkeerd      — has cohort progress but every potentially-
          //                       complete module is already canonical from
          //                       an earlier cert (typically post-merge);
          //                       issuance would produce nothing
          //   geen-voortgang   — no progress, no cert
          const isIssued = !!student.certificate;
          const moduleStatus = student.studentCurriculum?.moduleStatus ?? [];
          const isReady = moduleStatus.some((module) => module.newlyIssuable);
          const hasProgress = moduleStatus.some(
            (module) => module.completedCompetencies > 0,
          );
          const isBlocked = !isIssued && !isReady && hasProgress;
          const isNoProgress = !isIssued && !isReady && !hasProgress;

          return (
            (parsedSq.weergave.includes("uitgegeven") && isIssued) ||
            (parsedSq.weergave.includes("klaar-voor-uitgifte") &&
              !isIssued &&
              isReady) ||
            (parsedSq.weergave.includes("geblokkeerd") && isBlocked) ||
            (parsedSq.weergave.includes("geen-voortgang") && isNoProgress)
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

  return (
    <StudentsTable
      students={searchedStudents}
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
  );
}
