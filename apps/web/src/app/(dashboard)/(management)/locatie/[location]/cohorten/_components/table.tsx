import FlexSearch from "flexsearch";
import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { Suspense } from "react";
import { listCohortsForLocation, retrieveLocationByHandle } from "~/lib/nwd";
import { filterCohorts } from "~/utils/filter-cohorts";
import TableClient from "./table-client";

type TableProps = {
  params: Promise<{ location: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const searchParamsParser = createLoader({
  weergave: parseAsArrayOf(
    parseAsStringLiteral(["verleden", "aankomend", "open"] as const),
  ).withDefault(["open", "aankomend"]),
  query: parseAsString,
});

async function TableContent(props: TableProps) {
  const locationPromise = props.params.then((params) =>
    retrieveLocationByHandle(params.location),
  );
  const cohortsPromise = locationPromise.then((location) =>
    listCohortsForLocation(location.id),
  );
  const parsedSqPromise = searchParamsParser(props.searchParams);

  const [cohorts, parsedSq] = await Promise.all([
    cohortsPromise,
    parsedSqPromise,
  ]);

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
  for (const cohort of filteredCohorts) {
    index.add({
      id: cohort.id,
      label: cohort.label,
    });
  }

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
    <TableClient
      cohorts={searchedCohorts}
      totalItems={searchedCohorts.length}
    />
  );
}

export function Table(props: TableProps) {
  return (
    <Suspense
      fallback={<TableClient cohorts={[]} totalItems={0} placeholderRows={2} />}
    >
      <TableContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
