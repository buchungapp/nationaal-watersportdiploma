import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import {
  listPersonsForLocationWithPagination,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import Search from "../../../_components/search";
import { Dialogs } from "./_components/dialog-context";
import { DialogWrapper } from "./_components/dialog-context-client";
import { FilterSelect } from "./_components/filter";
import Table from "./_components/table";

// We need this for the bulk import
export const maxDuration = 240;

const searchParamsParser = createLoader({
  filter: parseAsArrayOf(
    parseAsStringLiteral(["student", "instructor", "location_admin"] as const),
  ),
  query: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(25),
});

async function PersonsTable(props: {
  params: Promise<{ location: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const location = await retrieveLocationByHandle(params.location);

  const {
    filter,
    query,
    page: currentPage,
    limit: paginationLimit,
  } = searchParamsParser(searchParams ?? {});

  const persons = await listPersonsForLocationWithPagination(location.id, {
    limit: paginationLimit,
    offset: (currentPage - 1) * paginationLimit,
    filter: { actorType: filter, q: query },
  });

  return <Table persons={persons.items} totalItems={persons.count} />;
}

export default function Page(props: {
  params: Promise<{
    location: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <DialogWrapper>
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="sm:flex-1 max-sm:w-full">
          <Heading>Personen</Heading>
          <div className="flex gap-4 mt-4 max-w-xl">
            <Search placeholder="Doorzoek personen..." />
            <FilterSelect />
          </div>
        </div>

        <Dialogs params={props.params} />
      </div>

      <Suspense
        fallback={<Table persons={[]} totalItems={0} placeholderRows={10} />}
      >
        <PersonsTable params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </DialogWrapper>
  );
}
