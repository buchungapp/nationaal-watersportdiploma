import { createLoader, parseAsInteger, parseAsString } from "nuqs/server";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { isSystemAdmin } from "~/lib/authorization";
import { getUserOrThrow, listAllLocationsAsAdmin } from "~/lib/nwd";
import Search from "../../_components/search";
import Table from "./_components/table";

const searchParamsParser = createLoader({
  query: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(25),
});

function sanitizePagination(page: number, limit: number) {
  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 25,
  };
}

function filterLocations(
  locations: Awaited<ReturnType<typeof listAllLocationsAsAdmin>>,
  query: string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return locations;

  return locations.filter(
    (location) =>
      location.name?.toLowerCase().includes(q) ||
      location.handle.toLowerCase().includes(q),
  );
}

async function LocatiesTableData(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const { query, page: rawPage, limit: rawLimit } = searchParamsParser(
    searchParams ?? {},
  );
  const { page, limit } = sanitizePagination(rawPage, rawLimit);

  const locations = await listAllLocationsAsAdmin();
  const filteredLocations = filterLocations(locations, query);
  const paginatedLocations = filteredLocations.slice(
    (page - 1) * limit,
    page * limit,
  );

  return (
    <Table locations={paginatedLocations} totalItems={filteredLocations.length} />
  );
}

export default async function LocatiesPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getUserOrThrow();

  if (!isSystemAdmin(user.email)) {
    return (
      <div className="mx-auto max-w-7xl">
        <Heading level={1}>Geen toegang</Heading>
        <Text className="mt-2">Je hebt geen toegang tot deze pagina.</Text>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <Heading level={1}>Vaarlocaties</Heading>
        <Text className="mt-2">Overzicht van alle vaarlocaties.</Text>
      </div>

      <div className="mt-4 max-w-xl">
        <Search placeholder="Zoek op naam of handle…" />
      </div>

      <Suspense
        fallback={<Table locations={[]} totalItems={0} placeholderRows={10} />}
      >
        <LocatiesTableData searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
