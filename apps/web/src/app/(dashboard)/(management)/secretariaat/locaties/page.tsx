import FlexSearch from "flexsearch";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { listLocations } from "~/lib/nwd";
import Search from "../../_components/search";
import { CreateLocationDialog } from "./_components/dialogs/create-location-dialog";
import { FilterSelect } from "./_components/filter";
import Table from "./_components/table";
import { searchParamsParser } from "./_search-params";

async function LocationsTable(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const {
    query,
    page: currentPage,
    limit: paginationLimit,
    filter: statusFilter,
  } = await searchParamsParser(props.searchParams);

  const locations = await listLocations({
    status: statusFilter,
  });

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
  for (const location of locations) {
    if (location.name) {
      index.add(location.id, location.name);
    }
  }

  // Search programs using FlexSearch
  let filteredLocations = locations;
  if (query) {
    const results = index.search(decodeURIComponent(query));
    filteredLocations = results.map(
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      (result) => locations.find((location) => location.id === result)!,
    );
  }

  // Pagination
  const paginatedLocations = filteredLocations.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return (
    <Table
      locations={paginatedLocations}
      totalItems={filteredLocations.length}
    />
  );
}

export default async function LocationsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <Heading level={1}>Vaarlocaties</Heading>
      <Text className="mt-2">Beheer alle vaarlocaties in het systeem.</Text>
      <div className="flex sm:flex-row flex-col justify-between gap-2 mt-4">
        <div className="flex items-center gap-2 w-full max-w-lg">
          <Search placeholder="Zoek vaarlocatie..." />
          <FilterSelect />
        </div>
        <CreateLocationDialog />
      </div>

      <Suspense
        fallback={<Table locations={[]} totalItems={0} placeholderRows={10} />}
      >
        <LocationsTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
