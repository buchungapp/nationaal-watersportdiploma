import FlexSearch from "flexsearch";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listDisciplines } from "~/lib/nwd";
import Search from "../../../_components/search";
import DisciplineTableCLient from "./_components/discipline-table";

async function DisciplineTable(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const disciplines = await listDisciplines();
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
  for (const discipline of disciplines) {
    if (discipline.title) {
      index.add(discipline.id, discipline.title);
    }
  }

  // Search programs using FlexSearch
  let filteredDisciplines = disciplines;
  if (searchQuery) {
    const results = index.search(decodeURIComponent(searchQuery));
    filteredDisciplines = results.map(
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
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
    <DisciplineTableCLient
      disciplines={paginatedDisciplines}
      totalItems={filteredDisciplines.length}
    />
  );
}

export default function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="sm:flex-1 max-sm:w-full">
          <Heading>Disciplines</Heading>
          <div className="flex gap-4 mt-4 max-w-xl">
            <Search placeholder="Doorzoek disciplines..." />
          </div>
        </div>
      </div>
      <Suspense
        fallback={
          <DisciplineTableCLient
            disciplines={[]}
            totalItems={0}
            placeholderRows={4}
          />
        }
      >
        <DisciplineTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
