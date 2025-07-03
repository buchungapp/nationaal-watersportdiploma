import { PlusIcon } from "@heroicons/react/16/solid";
import { Suspense } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listPvbsWithPagination, retrieveLocationByHandle } from "~/lib/nwd";
import Search from "../../../_components/search";
import { PvbTableWrapper } from "./_components/pvb-table-wrapper";
import { loadSearchParams } from "./_search-params";

async function PvbsTable(props: {
  params: Promise<{ location: string }>;
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

  const pvbs = await listPvbsWithPagination(location.id, {
    q,
    limit: paginationLimit,
    offset: (currentPage - 1) * paginationLimit,
  });

  return (
    <PvbTableWrapper
      pvbs={pvbs.items}
      totalItems={pvbs.count}
      locationId={location.id}
    />
  );
}

async function CreateButton(props: {
  params: Promise<{ location: string }>;
}) {
  const params = await props.params;

  return (
    <Button
      href={`/locatie/${params.location}/pvb-aanvragen/nieuw`}
      color="branding-orange"
    >
      <PlusIcon />
      Nieuwe aanvraag
    </Button>
  );
}

export default function Page(props: {
  params: Promise<{
    location: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="sm:flex-1 max-sm:w-full">
          <Heading>PvB aanvragen</Heading>
          <div className="flex gap-4 mt-4 max-w-xl">
            <Search placeholder="Doorzoek aanvragen..." />
          </div>
        </div>
        <CreateButton params={props.params} />
      </div>

      <Suspense
        fallback={
          <PvbTableWrapper
            placeholderRows={10}
            pvbs={[]}
            totalItems={0}
            locationId=""
          />
        }
      >
        <PvbsTable params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
