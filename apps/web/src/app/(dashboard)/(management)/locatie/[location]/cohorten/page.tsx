import FlexSearch from "flexsearch";

import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { Heading } from "~/app/(dashboard)/_components/heading";
import dayjs from "~/lib/dayjs";
import {
  listCohortsForLocation,
  listRolesForLocation,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import Search from "../../../_components/search";
import CreateDialog from "./_components/create-dialog";
import { FilterSelect } from "./_components/filter";
import Table from "./_components/table";

export default async function Page(props: {
  params: Promise<{
    location: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);

  const [cohorts, rolesInCurrentLocation] = await Promise.all([
    listCohortsForLocation(location.id),
    listRolesForLocation(location.id),
  ]);
  const isLocationAdmin = rolesInCurrentLocation.includes("location_admin");

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

  const index = new FlexSearch.Document({
    tokenize: "forward",
    context: {
      resolution: 9,
      depth: 2,
      bidirectional: true,
    },
    document: {
      id: "id",
      index: [{ field: "label", tokenize: "full" }],
    },
  });

  // Add cohorts to the index
  filteredCohorts.forEach((cohort) => {
    index.add({
      id: cohort.id,
      label: cohort.label,
    });
  });

  const searchQuery = parsedSq.query;

  let searchedCohorts = filteredCohorts;

  if (searchQuery && searchQuery.length >= 2) {
    const searchResult = index.search(decodeURIComponent(searchQuery));

    if (searchResult.length > 0) {
      searchedCohorts = filteredCohorts.filter((cohort) =>
        searchResult.flatMap(({ result }) => result).includes(cohort.id),
      );
    } else {
      searchedCohorts = [];
    }
  }

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
          {isLocationAdmin ? <FilterSelect /> : null}
        </div>
      </div>

      <div className="mt-4">
        <Table cohorts={searchedCohorts} totalItems={searchedCohorts.length} />
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
