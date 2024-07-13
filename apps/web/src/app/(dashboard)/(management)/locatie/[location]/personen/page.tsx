import Fuse from "fuse.js";
import {
  listCountries,
  listPersonsForLocation,
  retrieveLocationByHandle,
} from "~/lib/nwd";

import { PlusIcon } from "@heroicons/react/16/solid";
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
export const maxDuration = 60 * 5;

export default async function Page({
  params,
  searchParams,
}: {
  params: {
    location: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [location, countries] = await Promise.all([
    retrieveLocationByHandle(params.location),
    listCountries(),
  ]);

  const persons = await listPersonsForLocation(location.id);

  // Filter
  const filterParams = searchParams?.filter
    ? Array.isArray(searchParams.filter)
      ? searchParams.filter
      : [searchParams.filter]
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

  const searchQuery = searchParams?.query
    ? Array.isArray(searchParams.query)
      ? searchParams.query.join(" ")
      : searchParams.query
    : null;

  const searchedPersons =
    searchQuery && searchQuery.length >= 2
      ? personsFuse
          .search(decodeURIComponent(searchQuery))
          .map((result) => result.item)
      : filteredPersons;

  // Pagination
  const paginationLimit = searchParams?.limit ? Number(searchParams.limit) : 25;
  const currentPage = searchParams?.page ? Number(searchParams.page) : 1;

  const paginatedPersons = searchedPersons.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return (
    <DialogWrapper>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Personen</Heading>
          <div className="mt-4 flex max-w-xl gap-4">
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
