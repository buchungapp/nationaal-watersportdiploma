import Fuse from "fuse.js";
import { listPersonsForLocation, retrieveLocationByHandle } from "~/lib/nwd";
import { TablePagination } from "../../_components/table-pagination";
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

  // Search
  const personsFuse = new Fuse(persons, {
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
      : persons;

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
          <h1 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Personen
          </h1>

          <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
            Een overzicht van personen die een rol hebben binnen de locatie.
          </p>
        </div>
        <div className="mt-4 sm:flex sm:items-center sm:space-x-2 md:mt-0">
          <FilterSelect />
          <button
            type="button"
            className="mt-2 flex h-9 w-full items-center whitespace-nowrap rounded-tremor-small bg-branding-light px-4 py-2.5 text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-branding-dark dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis sm:mt-0 sm:w-fit"
          >
            Persoon toevoegen
          </button>
        </div>
      </div>
      <div className="mt-4">
        <Search />
      </div>

      <Table persons={paginatedPersons} />

      <div className="mt-4 flex w-full justify-end">
        <TablePagination totalItems={persons.length} />
      </div>
    </div>
  );
}