import FlexSearch from "flexsearch";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import {
  listCategories,
  listCourses,
  listDisciplines,
  listParentCategories,
} from "~/lib/nwd";
import Search from "../../../_components/search";
import CourseTableClient from "./_components/course-table";
import { CreateCourseDialog } from "./_components/dialogs/create-course-dialog";

async function ProgramTable(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const [courses, parentCategories] = await Promise.all([
    listCourses(),
    listParentCategories(),
  ]);

  const searchQuery = searchParams?.query?.toString() ?? null;

  // Create a FlexSearch index
  const index = new FlexSearch.Index({
    tokenize: "full",
    context: {
      resolution: 9,
      depth: 2,
      bidirectional: true,
    },
  });

  // Add programs to the index
  for (const course of courses) {
    if (course.title) {
      index.add(course.id, course.title);
    }
  }

  // Search programs using FlexSearch
  let filteredCourses = courses;
  if (searchQuery) {
    const results = index.search(decodeURIComponent(searchQuery));
    filteredCourses = results.map(
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      (result) => courses.find((course) => course.id === result)!,
    );
  }

  // Pagination
  const paginationLimit = searchParams?.limit ? Number(searchParams.limit) : 25;
  const currentPage = searchParams?.page ? Number(searchParams.page) : 1;

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return (
    <CourseTableClient
      courses={paginatedCourses}
      parentCategories={parentCategories}
      totalItems={filteredCourses.length}
    />
  );
}

async function CreateCourseDialogSuspense() {
  const [parentCategories, disciplines, allCategories] = await Promise.all([
    listParentCategories(),
    listDisciplines(),
    listCategories(),
  ]);

  return (
    <CreateCourseDialog
      disciplines={disciplines}
      parentCategories={parentCategories}
      allCategories={allCategories}
    />
  );
}

export default async function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="sm:flex-1 max-sm:w-full">
          <Heading>Cursussen</Heading>
          <div className="flex gap-4 mt-4 max-w-xl">
            <Search placeholder="Doorzoek cursussen..." />
          </div>
        </div>
        <Suspense
          fallback={<div className="rounded-lg w-40.5 h-9 animate-pulse" />}
        >
          <CreateCourseDialogSuspense />
        </Suspense>
      </div>
      <Suspense
        fallback={
          <CourseTableClient
            courses={[]}
            parentCategories={[]}
            totalItems={0}
            placeholderRows={4}
          />
        }
      >
        <ProgramTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
