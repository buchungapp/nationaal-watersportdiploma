import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listCohortsForLocation, retrieveLocationByHandle } from "~/lib/nwd";
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
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const location = await retrieveLocationByHandle(params.location);
  const cohorts = await listCohortsForLocation(location.id);

  const parsedSq = createSearchParamsCache({
    weergave: parseAsArrayOf(
      parseAsStringLiteral(["verleden", "aankomend"] as const),
    ),
    query: parseAsString,
  }).parse(searchParams);

  const filteredCohorts =
    parsedSq.weergave && parsedSq.weergave.length > 0
      ? filterCohorts(cohorts, parsedSq.weergave)
      : cohorts;

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

      <div className="mt-8">
        <div className="flex sm:justify-end">
          <FilterSelect />
        </div>
        <Table cohorts={filteredCohorts} totalItems={filteredCohorts.length} />
      </div>
    </>
  );
}

function filterCohorts(
  cohorts: Awaited<ReturnType<typeof listCohortsForLocation>>,
  weergave: ("verleden" | "aankomend")[],
) {
  if (weergave.includes("verleden") && weergave.includes("aankomend")) {
    return cohorts;
  }

  if (weergave.includes("verleden")) {
    return cohorts.filter(
      (cohort) => new Date(cohort.accessEndTime) < new Date(),
    );
  }

  if (weergave.includes("aankomend")) {
    return cohorts.filter(
      (cohort) => new Date(cohort.accessEndTime) > new Date(),
    );
  }

  return [];
}
