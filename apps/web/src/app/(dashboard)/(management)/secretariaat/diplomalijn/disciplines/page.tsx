import FlexSearch from "flexsearch";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listDisciplines } from "~/lib/nwd";
import Search from "../../../_components/search";
import DisciplineTableCLient from "./_components/discipline-table";
import EditDialog from "./_components/edit-dialog";

async function DisciplineTable({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const disciplines = await listDisciplines();
  const searchQuery = searchParams?.query?.toString() ?? null;

  const editDisciplineId = searchParams?.bewerken?.toString() ?? null;
  const editDiscipline =
    disciplines.find((discipline) => discipline.id === editDisciplineId) ??
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
  disciplines.forEach((discipline) => {
    index.add(discipline.id, discipline.title!);
  });

  // Search programs using FlexSearch
  let filteredDisciplines = disciplines;
  if (searchQuery) {
    const results = index.search(decodeURIComponent(searchQuery));
    filteredDisciplines = results.map(
      (result) => disciplines.find((discipline) => discipline.id === result)!,
    );
  }

  // Pagination
  const paginationLimit = searchParams?.limit ? Number(searchParams.limit) : 25;
  const currentPage = searchParams?.page ? Number(searchParams.page) : 1;

  const paginatedDisciplines = filteredDisciplines.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return (
    <>
      <DisciplineTableCLient
        disciplines={paginatedDisciplines}
        totalItems={filteredDisciplines.length}
      />
      <EditDialog key={editDiscipline?.id} editDiscipline={editDiscipline} />
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
          <Heading>Disciplines</Heading>
          <div className="mt-4 flex max-w-xl gap-4">
            <Search placeholder="Doorzoek disciplines..." />
          </div>
        </div>
      </div>
      <DisciplineTable searchParams={searchParams} />
    </>
  );
}
