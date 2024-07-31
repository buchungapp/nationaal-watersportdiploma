import dayjs from "dayjs";
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listCohortsForLocation, retrieveLocationByHandle } from "~/lib/nwd";
import Search from "../../../_components/search";
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
      parseAsStringLiteral(["verleden", "aankomend", "open"] as const),
    ).withDefault(["open", "aankomend"]),
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
        </div>
        <CreateDialog locationId={location.id} />
      </div>

      <div className="mt-8 flex flex-col sm:flex-row items-start sm:justify-between sm:items-center gap-1">
        <div className="w-full max-w-xl">
          <Search placeholder="Doorzoek cohorten..." />
        </div>
        <div className="flex items-center gap-1 sm:shrink-0">
          <FilterSelect />
        </div>
      </div>

      <div className="mt-4">
        <Table cohorts={filteredCohorts} totalItems={filteredCohorts.length} />
      </div>
    </>
  );
}

function filterCohorts(
  cohorts: Awaited<ReturnType<typeof listCohortsForLocation>>,
  weergave: ("verleden" | "aankomend" | "open")[],
) {
  const now = dayjs();

  return cohorts.filter((cohort) => {
    const startTime = dayjs(cohort.accessStartTime);
    const endTime = dayjs(cohort.accessEndTime);
    return (
      (weergave.includes("verleden") && now.isAfter(endTime)) ||
      (weergave.includes("aankomend") && now.isBefore(startTime)) ||
      (weergave.includes("open") &&
        now.isAfter(startTime) &&
        now.isBefore(endTime))
    );
  });
}
