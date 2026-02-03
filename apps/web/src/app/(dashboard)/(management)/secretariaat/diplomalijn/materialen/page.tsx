import FlexSearch from "flexsearch";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listGearTypes } from "~/lib/nwd";
import Search from "../../../_components/search";
import GearTypeTableCLient from "./_components/gear-type-table";

async function GearTypeTable(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const gearTypes = await listGearTypes();
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
  for (const gearType of gearTypes) {
    if (gearType.title) {
      index.add(gearType.id, gearType.title);
    }
  }

  // Search programs using FlexSearch
  let filteredGearTypes = gearTypes;
  if (searchQuery) {
    const results = index.search(decodeURIComponent(searchQuery));
    filteredGearTypes = results.map(
      // biome-ignore lint/style/noNonNullAssertion: intentional
      (result) => gearTypes.find((gearType) => gearType.id === result)!,
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
    <GearTypeTableCLient
      gearTypes={paginatedGearTypes}
      totalItems={filteredGearTypes.length}
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
          <Heading>Materialen</Heading>
          <div className="flex gap-4 mt-4 max-w-xl">
            <Search placeholder="Doorzoek materialen..." />
          </div>
        </div>
      </div>
      <Suspense
        fallback={
          <GearTypeTableCLient
            gearTypes={[]}
            totalItems={0}
            placeholderRows={4}
          />
        }
      >
        <GearTypeTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
