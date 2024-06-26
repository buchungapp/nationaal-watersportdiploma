import Fuse from "fuse.js";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listCertificates, retrieveLocationByHandle } from "~/lib/nwd";
import Search from "../../../_components/search";
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
    threshold: 0.3, // Lower threshold for more specific matches
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
  );
}
