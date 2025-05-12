import FlexSearch from "flexsearch";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listDegrees } from "~/lib/nwd";
import Search from "../../../_components/search";
import DegreeTableCLient from "./_components/degree-table";

async function DegreesTable(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const degrees = await listDegrees();
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
  for (const degree of degrees) {
    if (degree.title) {
      index.add(degree.id, degree.title);
    }
  }

  // Search programs using FlexSearch
  let filteredDegrees = degrees;
  if (searchQuery) {
    const results = index.search(decodeURIComponent(searchQuery));
    filteredDegrees = results.map(
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      (result) => degrees.find((degree) => degree.id === result)!,
    );
  }

  // Pagination
  const paginationLimit = searchParams?.limit ? Number(searchParams.limit) : 25;
  const currentPage = searchParams?.page ? Number(searchParams.page) : 1;

  const paginatedDegrees = filteredDegrees.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return (
    <DegreeTableCLient
      degrees={paginatedDegrees}
      totalItems={filteredDegrees.length}
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
          <Heading>Niveaus</Heading>
          <div className="flex gap-4 mt-4 max-w-xl">
            <Search placeholder="Doorzoek niveaus..." />
          </div>
        </div>
      </div>
      <Suspense
        fallback={
          <DegreeTableCLient degrees={[]} totalItems={0} placeholderRows={4} />
        }
      >
        <DegreesTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
