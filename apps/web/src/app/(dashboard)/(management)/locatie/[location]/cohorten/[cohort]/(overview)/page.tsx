import FlexSearch from "flexsearch";

import { notFound } from "next/navigation";
import { createLoader, parseAsString, parseAsStringLiteral } from "nuqs/server";
import { TextLink } from "~/app/(dashboard)/_components/text";
import {
  isInstructorInCohort,
  listCurriculaByPersonId,
  listCurriculaProgressByPersonId,
  listPrivilegesForCohort,
  listRolesForLocation,
  listStudentsWithCurriculaByCohortId,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import StudentsTable from "./_components/students-table";

export type StudentsProgressData = Array<{
  personId: string;
  curricula: Array<{
    curriculum: Awaited<ReturnType<typeof listCurriculaByPersonId>>[number];
    progress:
      | Awaited<ReturnType<typeof listCurriculaProgressByPersonId>>[number]
      | null;
  }>;
}>;

const searchParamsParser = (defaultValue: "allen" | "geclaimd") =>
  createLoader({
    overzicht: parseAsStringLiteral(["allen", "geclaimd"] as const).withDefault(
      defaultValue,
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

  const parsedSq = searchParamsParser(defaultView)(searchParams);

  let filteredStudents = students;

  if (parsedSq.overzicht === "geclaimd" && !!instructorAllocation) {
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
        { field: "gearType", tokenize: "forward" },
      ],
    },
  });

  // Add students to the index
  for (const student of filteredStudents) {
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
  }

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

  const studentsProgressPromise = async () => {
    const uniquePersonIds = [
      ...new Set(searchedStudents.map((student) => student.person.id)),
    ];

    if (uniquePersonIds.length === 0) {
      return [];
    }

    const [curricula, progress] = await Promise.all([
      listCurriculaByPersonId(uniquePersonIds, true),
      listCurriculaProgressByPersonId(uniquePersonIds, false, false),
    ]);

    const curriculaByPersonId = new Map<string, typeof curricula>();
    const progressByStudentCurriculumId = new Map<
      string,
      (typeof progress)[number]
    >();

    for (const curriculum of curricula) {
      const existing = curriculaByPersonId.get(curriculum.personId);
      if (existing) {
        existing.push(curriculum);
      } else {
        curriculaByPersonId.set(curriculum.personId, [curriculum]);
      }
    }

    for (const progressItem of progress) {
      progressByStudentCurriculumId.set(
        progressItem.studentCurriculumId,
        progressItem,
      );
    }

    return uniquePersonIds.map((personId) => {
      const personCurricula = curriculaByPersonId.get(personId) || [];

      return {
        personId,
        curricula: personCurricula.map((curriculum) => ({
          curriculum,
          progress: progressByStudentCurriculumId.get(curriculum.id) || null,
        })),
      };
    });
  };

  return (
    <StudentsTable
      view={instructorAllocation ? parsedSq.overzicht : null}
      students={searchedStudents}
      totalItems={searchedStudents.length}
      cohortId={cohort.id}
      locationId={location.id}
      studentsProgressPromise={studentsProgressPromise()}
      // TODO: this can be optimized
      locationRoles={await listRolesForLocation(location.id)}
      noOptionsLabel={
        parsedSq.query && parsedSq.query.length > 2 ? (
          "Geen resultaten gevonden"
        ) : parsedSq.overzicht === "allen" ? (
          "Dit cohort heeft nog geen cursisten"
        ) : (
          <span>
            Je hebt nog geen cursisten geclaimd.{" "}
            <TextLink
              href={`/locatie/${params.location}/cohorten/${params.cohort}?overzicht=allen`}
            >
              Bekijk alle cursisten
            </TextLink>
            .
          </span>
        )
      }
    />
  );
}
