import { Heading } from "~/app/(dashboard)/_components/heading";
import { listCohortsForLocation, retrieveLocationByHandle } from "~/lib/nwd";
import CreateDialog from "./_components/create-dialog";
import Table from "./_components/table";

export default async function Page({
  params,
}: {
  params: {
    location: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const location = await retrieveLocationByHandle(params.location);

  const cohorts = await listCohortsForLocation(location.id);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Cohorten</Heading>
          {/* <div className="mt-4 flex max-w-xl gap-4">
            <Search placeholder="Doorzoek cohorten..." />
            <FilterSelect />
          </div> */}
        </div>
        <CreateDialog locationId={location.id} />
      </div>

      <Table cohorts={cohorts} totalItems={cohorts.length} />
    </>
  );
}
