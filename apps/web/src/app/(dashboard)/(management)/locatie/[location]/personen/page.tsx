import Fuse from "fuse.js";
import {
  listCountries,
  listPersonsForLocation,
  retrieveLocationByHandle,
} from "~/lib/nwd";

import { PlusIcon } from "@heroicons/react/16/solid";
import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
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
  filter: parseAsArrayOf(parseAsString),
  query: parseAsString,
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

  const persons = await listPersonsForLocation(location.id);

  const parsedSq = searchParamsParser(searchParams);

  // Filter
  const filterParams = parsedSq.filter
    ? Array.isArray(parsedSq.filter)
      ? parsedSq.filter
      : [parsedSq.filter]
    : [];

  const filteredPersons =
    filterParams.length > 0
      ? persons.filter((person) =>
          person.actors.some((actor) => filterParams.includes(actor.type)),
        )
      : persons;

  // Search
  const personsFuse = new Fuse(filteredPersons, {
    includeMatches: true,
    keys: ["firstName", "lastNamePrefix", "lastName", "email", "handle"],
    minMatchCharLength: 2,
    ignoreLocation: true,
    threshold: 0.3, // Lower threshold for more specific matches
  });

  const searchQuery = parsedSq.query
    ? Array.isArray(parsedSq.query)
      ? parsedSq.query.join(" ")
      : parsedSq.query
    : null;

  const searchedPersons =
    searchQuery && searchQuery.length >= 2
      ? personsFuse
          .search(decodeURIComponent(searchQuery))
          .map((result) => result.item)
      : filteredPersons;

  // Pagination
  const paginationLimit = parsedSq.limit;
  const currentPage = parsedSq.page;

  const paginatedPersons = searchedPersons.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

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

      <Table persons={paginatedPersons} totalItems={searchedPersons.length} />

      <Dialogs locationId={location.id} countries={countries} />
    </DialogWrapper>
  );
}
