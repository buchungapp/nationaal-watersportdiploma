import FlexSearch from "flexsearch";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listGearTypes } from "~/lib/nwd";
import Search from "../../../_components/search";
import EditDialog from "./_components/edit-dialog";
import GearTypeTableCLient from "./_components/gear-type-table";

async function GearTypeTable({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const gearTypes = await listGearTypes();
  const searchQuery = searchParams?.query?.toString() ?? null;

  const editGearTypeId = searchParams?.bewerken?.toString() ?? null;
  const editGearType =
    gearTypes.find((gearType) => gearType.id === editGearTypeId) ?? null;

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
  gearTypes.forEach((gearType) => {
    index.add(gearType.id, gearType.title!);
  });

  // Search programs using FlexSearch
  let filteredGearTypes = gearTypes;
  if (searchQuery) {
    const results = index.search(decodeURIComponent(searchQuery));
    filteredGearTypes = results.map(
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
    <>
      <GearTypeTableCLient
        gearTypes={paginatedGearTypes}
        totalItems={filteredGearTypes.length}
      />
      <EditDialog editGearType={editGearType} />
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Materialen</Heading>
          <div className="mt-4 flex max-w-xl gap-4">
            <Search placeholder="Doorzoek materialen..." />
          </div>
        </div>
      </div>
      <GearTypeTable searchParams={searchParams} />
    </>
  );
}
