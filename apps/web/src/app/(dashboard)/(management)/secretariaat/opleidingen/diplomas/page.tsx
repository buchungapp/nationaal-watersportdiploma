import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listCertificatesWithPagination } from "~/lib/nwd";
import Search from "../../../_components/search";
import Table from "./_components/table";
import { loadSearchParams } from "./_search-params";

async function CertificatesTable(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const {
    limit: paginationLimit,
    page: currentPage,
    query: q,
  } = await loadSearchParams(props.searchParams);

  const certificates = await listCertificatesWithPagination({
    q,
    limit: paginationLimit,
    offset: (currentPage - 1) * paginationLimit,
  });

  return (
    <Table certificates={certificates.items} totalItems={certificates.count} />
  );
}

export default function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="sm:flex-1 max-sm:w-full">
          <Heading>Diploma's</Heading>
          <div className="flex gap-4 mt-4 max-w-xl">
            <Search placeholder="Doorzoek diploma's..." />
          </div>
        </div>
        {/* <CreateDialog /> */}
      </div>

      <Suspense
        fallback={
          <Table placeholderRows={10} certificates={[]} totalItems={0} />
        }
      >
        <CertificatesTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
