import FlexSearch from "flexsearch";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listCompetencies } from "~/lib/nwd";
import Search from "../../../_components/search";
import ProgramCompetencyClient from "./_components/program-table";

async function CompetencyTable({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
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

  const paginatedPrograms = filteredCompetencies.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return (
    <ProgramCompetencyClient
      competencies={paginatedPrograms}
      totalItems={filteredCompetencies.length}
    />
  );
}

export default async function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Competenties</Heading>
          <div className="mt-4 flex max-w-xl gap-4">
            <Search placeholder="Doorzoek competenties..." />
          </div>
        </div>
      </div>
      <CompetencyTable searchParams={searchParams} />
    </>
  );
}
