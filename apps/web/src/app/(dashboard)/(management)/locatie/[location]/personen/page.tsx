import {
  listCountries,
  listPersonsForLocationWithPagination,
  retrieveLocationByHandle,
} from "~/lib/nwd";

import { PlusIcon } from "@heroicons/react/16/solid";
import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import { Heading } from "~/app/(dashboard)/_components/heading";
import Search from "../../../_components/search";
import {
  DialogButtons,
  DialogWrapper,
  Dialogs,
} from "./_components/dialog-context";
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

export default async function Page(props: {
  params: Promise<{
    location: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const [location, countries] = await Promise.all([
    retrieveLocationByHandle(params.location),
    listCountries(),
  ]);

  const {
    filter,
    query,
    page: currentPage,
    limit: paginationLimit,
  } = searchParamsParser(searchParams);
  const persons = await listPersonsForLocationWithPagination(location.id, {
    limit: paginationLimit,
    offset: (currentPage - 1) * paginationLimit,
    filter: { actorType: filter, q: query },
  });

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
        <Dropdown>
          <DropdownButton color="branding-orange">
            <PlusIcon />
            Persoon aanmaken
          </DropdownButton>
          <DropdownMenu>
            <DialogButtons />
          </DropdownMenu>
        </Dropdown>
      </div>

      <Table persons={persons.items} totalItems={persons.count} />

      <Dialogs locationId={location.id} countries={countries} />
    </DialogWrapper>
  );
}
