import Fuse from "fuse.js";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listCertificates, retrieveLocationByHandle } from "~/lib/nwd";
import Search from "../_components/search";
import CreateDialog from "./_components/create-dialog";
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
  const certificates = await listCertificates(location.id);

  // Search
  const certificatesFuse = new Fuse(certificates, {
    includeMatches: true,
    keys: [
      "handle",
      "student.firstName",
      "student.lastNamePrefix",
      "student.lastName",
      "student.email",
    ],
    minMatchCharLength: 2,
    ignoreLocation: true,
  });

  const searchQuery = searchParams?.query
    ? Array.isArray(searchParams.query)
      ? searchParams.query.join(" ")
      : searchParams.query
    : null;

  const searchedCertificates =
    searchQuery && searchQuery.length >= 2
      ? certificatesFuse.search(searchQuery).map((result) => result.item)
      : certificates;

  // Pagination
  const paginationLimit = searchParams?.limit ? Number(searchParams.limit) : 25;
  const currentPage = searchParams?.page ? Number(searchParams.page) : 1;

  const paginatedCertificates = searchedCertificates.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Diploma's</Heading>
          <div className="mt-4 flex max-w-xl gap-4">
            <Search placeholder="Doorzoek diploma's..." />
          </div>
        </div>
        <CreateDialog locationId={location.id} />
      </div>

      <Table
        certificates={paginatedCertificates}
        totalItems={certificates.length}
      />
    </>

    // <div className="py-16">
    //   <div className="md:flex md:items-center md:justify-between md:space-x-8 pb-4 border-b border-gray-200">
    //     <div>
    //       <h1 className="font-semibold text-zinc-950 dark:text-white text-lg/6 sm:text-base/6">
    //         Diploma's
    //       </h1>

    //       <p className="mt-1 leading-6 text-zinc-600 dark:text-zinc-300 text-sm">
    //         Een overzicht van uitgegeven diploma's.
    //       </p>
    //     </div>
    //     <div className="mt-4 md:mt-0">
    //       <CreateDialog locationId={location.id} />
    //     </div>
    //   </div>
    //   <div className="mt-4 w-full flex flex-col gap-2 sm:flex-row">
    //     <Search />
    //     {/* <FilterSelect /> */}
    //   </div>

    // <Table
    //   certificates={paginatedCertificates}
    //   totalItems={certificates.length}
    // />
    // </div>
  );
}
