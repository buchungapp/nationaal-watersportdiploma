import FlexSearch from "flexsearch";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listCourses, listParentCategories } from "~/lib/nwd";
import Search from "../../../_components/search";
import CourseTableClient from "./_components/course-table";

async function ProgramTable({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
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

export default async function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Cursussen</Heading>
          <div className="mt-4 flex max-w-xl gap-4">
            <Search placeholder="Doorzoek cursussen..." />
          </div>
        </div>
      </div>
      <ProgramTable searchParams={searchParams} />
    </>
  );
}
