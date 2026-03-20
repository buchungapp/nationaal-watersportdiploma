import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { isSystemAdmin } from "~/lib/authorization";
import { getUserOrThrow, listAllLocationsAsAdmin } from "~/lib/nwd";
import Table from "./_components/table";

async function LocatiesTableData(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const locations = await listAllLocationsAsAdmin();

  const paginationLimit = searchParams?.limit
    ? Number(searchParams.limit)
    : 25;
  const currentPage = searchParams?.page ? Number(searchParams.page) : 1;

  const paginatedLocations = locations.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return <Table locations={paginatedLocations} totalItems={locations.length} />;
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

      <Suspense
        fallback={<Table locations={[]} totalItems={0} placeholderRows={10} />}
      >
        <LocatiesTableData searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
