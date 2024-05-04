import Fuse from "fuse.js";
import { listPersonsForLocation, retrieveLocationByHandle } from "~/lib/nwd";
import Search from "../_components/search";
import CreateDialog from "./_components/create-dialog";
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
          <h1 className="font-semibold text-zinc-950 dark:text-white text-lg/6 sm:text-base/6">
            Personen
          </h1>

          <p className="mt-1 leading-6 text-zinc-600 dark:text-zinc-300 text-sm">
            Een overzicht van personen die een rol hebben binnen de locatie.
          </p>
        </div>
        <div className="mt-4 sm:flex sm:items-center sm:space-x-2 md:mt-0">
          <FilterSelect />
          <CreateDialog />
        </div>
      </div>
      <div className="mt-4">
        <Search />
      </div>

      <Table persons={paginatedPersons} totalItems={persons.length} />
    </div>
  );
}
