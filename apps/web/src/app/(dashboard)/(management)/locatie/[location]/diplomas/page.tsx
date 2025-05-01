import { Heading } from "~/app/(dashboard)/_components/heading";
import {
  listCertificatesWithPagination,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import Search from "../../../_components/search";
import CreateDialog from "./_components/create-dialog";
import Table from "./_components/table";
import { loadSearchParams } from "./search-params";
export default async function Page(props: {
  params: Promise<{
    location: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const location = await retrieveLocationByHandle(params.location);

  const {
    limit: paginationLimit,
    page: currentPage,
    query: q,
  } = loadSearchParams(searchParams ?? {});

  const certificates = await listCertificatesWithPagination(location.id, {
    q,
    limit: paginationLimit,
    offset: (currentPage - 1) * paginationLimit,
  });

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
        certificates={certificates.items}
        totalItems={certificates.count}
      />
    </>
  );
}
