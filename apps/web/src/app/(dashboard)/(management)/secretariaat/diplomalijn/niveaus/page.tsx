import FlexSearch from "flexsearch";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listDegrees } from "~/lib/nwd";
import Search from "../../../_components/search";
import DegreeTableCLient from "./_components/degree-table";

async function DegreesTable({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
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
  degrees.forEach((degree) => {
    index.add(degree.id, degree.title!);
  });

  // Search programs using FlexSearch
  let filteredGearTypes = degrees;
  if (searchQuery) {
    const results = index.search(decodeURIComponent(searchQuery));
    filteredGearTypes = results.map(
      (result) => degrees.find((degree) => degree.id === result)!,
    );
  }

  // Pagination
  const paginationLimit = searchParams?.limit ? Number(searchParams.limit) : 25;
  const currentPage = searchParams?.page ? Number(searchParams.page) : 1;

  const paginatedGearTypes = filteredGearTypes.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return (
    <DegreeTableCLient
      degrees={paginatedGearTypes}
      totalItems={filteredGearTypes.length}
    />
  );
}

export default async function Page(
  props: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Niveaus</Heading>
          <div className="mt-4 flex max-w-xl gap-4">
            <Search placeholder="Doorzoek niveaus..." />
          </div>
        </div>
      </div>
      <DegreesTable searchParams={searchParams} />
    </>
  );
}
