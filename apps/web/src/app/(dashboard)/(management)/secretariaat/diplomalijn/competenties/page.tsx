import FlexSearch from "flexsearch";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listCompetencies } from "~/lib/nwd";
import Search from "../../../_components/search";
import EditDialog from "./_components/edit-dialog";
import ProgramCompetencyClient from "./_components/program-table";

async function CompetencyTable({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const competencies = await listCompetencies();
  const searchQuery = searchParams?.query?.toString() ?? null;

  const editCompetencyId = searchParams?.bewerken?.toString() ?? null;
  const editCompetency =
    competencies.find((competency) => competency.id === editCompetencyId) ??
    null;

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
  competencies.forEach((competency) => {
    index.add(competency.id, competency.title!);
  });

  // Search programs using FlexSearch
  let filteredCompetencies = competencies;
  if (searchQuery) {
    const results = index.search(decodeURIComponent(searchQuery));
    filteredCompetencies = results.map(
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
    <>
      <ProgramCompetencyClient
        competencies={paginatedPrograms}
        totalItems={filteredCompetencies.length}
      />
      <EditDialog editCompetency={editCompetency} />
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
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
