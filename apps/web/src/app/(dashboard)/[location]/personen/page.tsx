import Fuse from "fuse.js";
import { listPersonsForLocation, retrieveLocationByHandle } from "~/lib/nwd";
import Search from "../_components/search";
import { FilterSelect } from "./_components/filter";
import Table from "./_components/table";

export default async function Page({
  params,
  searchParams,
}: {
  params: {
    location: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const location = await retrieveLocationByHandle(params.location);
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
    keys: ["firstName", "lastNamePrefix", "lastName", "email"],
    minMatchCharLength: 2,
    ignoreLocation: true,
  });

  const searchQuery = searchParams?.query
    ? Array.isArray(searchParams.query)
      ? searchParams.query.join(" ")
      : searchParams.query
    : null;

  const searchedPersons =
    searchQuery && searchQuery.length >= 2
      ? personsFuse.search(searchQuery).map((result) => result.item)
      : filteredPersons;

  // Pagination
  const paginationLimit = searchParams?.limit ? Number(searchParams.limit) : 25;
  const currentPage = searchParams?.page ? Number(searchParams.page) : 1;

  const paginatedPersons = searchedPersons.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return (
    <div className="py-16">
      <div className="md:flex md:items-center md:justify-between md:space-x-8 pb-4 border-b border-gray-200">
        <div>
          <h1 className="font-semibold text-zinc-950 dark:text-white text-lg/6 sm:text-base/6">
            Personen
          </h1>

          <p className="mt-1 leading-6 text-zinc-600 dark:text-zinc-300 text-sm">
            Een overzicht van personen die een rol hebben binnen de locatie.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            type="button"
            className="mt-2 flex h-9 w-full items-center whitespace-nowrap rounded-tremor-small bg-branding-light px-4 py-2.5 text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-branding-dark dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis sm:mt-0 sm:w-fit"
          >
            Persoon toevoegen
          </button>
        </div>
      </div>
      <div className="mt-4 w-full flex flex-col gap-2 sm:flex-row">
        <Search />
        <FilterSelect />
      </div>

      <Table persons={paginatedPersons} totalItems={persons.length} />
    </div>
  );
}
