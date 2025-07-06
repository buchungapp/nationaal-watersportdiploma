import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listCourses, listKssInstructiegroepenWithCourses } from "~/lib/nwd";
import Search from "../../../_components/search";
import InstructiegroepTableClient from "./_components/instructiegroep-table";

async function InstructiegroepTable(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.q as string | undefined;

  // Fetch all instructiegroepen with their courses
  const [instructiegroepen, allCourses] = await Promise.all([
    listKssInstructiegroepenWithCourses(),
    listCourses(),
  ]);

  // Transform courses to the format expected by the client component
  const availableCourses = allCourses
    .filter((course) => course.title !== null)
    .map((course) => ({
      id: course.id,
      title: course.title as string,
      handle: course.handle,
    }));

  // Filter based on search query
  const filteredInstructiegroepen = query
    ? instructiegroepen.filter(
        (ig) =>
          ig.title.toLowerCase().includes(query.toLowerCase()) ||
          ig.richting.toLowerCase().includes(query.toLowerCase()) ||
          ig.courses.some((c) =>
            c.title?.toLowerCase().includes(query.toLowerCase()),
          ),
      )
    : instructiegroepen;

  // Sort by title
  const sortedInstructiegroepen = filteredInstructiegroepen.sort((a, b) =>
    a.title.localeCompare(b.title),
  );

  // Pagination
  const paginationLimit = searchParams?.limit ? Number(searchParams.limit) : 25;
  const currentPage = searchParams?.page ? Number(searchParams.page) : 1;

  const paginatedInstructiegroepen = sortedInstructiegroepen.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return (
    <InstructiegroepTableClient
      instructiegroepen={paginatedInstructiegroepen}
      totalItems={sortedInstructiegroepen.length}
      availableCourses={availableCourses}
    />
  );
}

export default function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="sm:flex-1 max-sm:w-full">
          <Heading>Instructiegroepen</Heading>
          <div className="flex gap-4 mt-4 max-w-xl">
            <Search placeholder="Doorzoek instructiegroepen..." />
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <InstructiegroepTableClient
            instructiegroepen={[]}
            totalItems={0}
            placeholderRows={4}
            availableCourses={[]}
          />
        }
      >
        <InstructiegroepTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
