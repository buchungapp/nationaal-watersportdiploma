import FlexSearch from "flexsearch";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listCompetencies } from "~/lib/nwd";
import Search from "../../../_components/search";
import CompetencyTableClient from "./_components/competency-table";

async function CompetencyTable(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const competencies = await listCompetencies();
  const searchQuery = searchParams?.query?.toString() ?? null;

  // Create a FlexSearch index
  const index = new FlexSearch.Index({
    tokenize: "full",
    context: {
      resolution: 9,
      depth: 2,
      bidirectional: true,
    },
  });

  // Add programs to the index
  for (const competency of competencies) {
    if (competency.title) {
      index.add(competency.id, competency.title);
    }
  }

  // Search programs using FlexSearch
  let filteredCompetencies = competencies;
  if (searchQuery) {
    const results = index.search(decodeURIComponent(searchQuery));
    filteredCompetencies = results.map(
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      (result) => competencies.find((competency) => competency.id === result)!,
    );
  }

  // Pagination
  const paginationLimit = searchParams?.limit ? Number(searchParams.limit) : 25;
  const currentPage = searchParams?.page ? Number(searchParams.page) : 1;

  const paginatedCompetencies = filteredCompetencies.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return (
    <CompetencyTableClient
      competencies={paginatedCompetencies}
      totalItems={filteredCompetencies.length}
    />
  );
}

export default async function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="sm:flex-1 max-sm:w-full">
          <Heading>Competenties</Heading>
          <div className="flex gap-4 mt-4 max-w-xl">
            <Search placeholder="Doorzoek competenties..." />
          </div>
        </div>
      </div>
      <Suspense
        fallback={
          <CompetencyTableClient
            competencies={[]}
            totalItems={0}
            placeholderRows={4}
          />
        }
      >
        <CompetencyTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
