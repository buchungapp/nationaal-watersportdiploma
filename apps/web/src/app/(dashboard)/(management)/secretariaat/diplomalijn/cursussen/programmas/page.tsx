import FlexSearch from "flexsearch";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listPrograms } from "~/lib/nwd";
import Search from "../../../../_components/search";
import ProgramTableClient from "../_components/program-table";

async function ProgramTable({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const [programs] = await Promise.all([listPrograms()]);
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
  for (const program of programs) {
    if (program.course.title) {
      index.add(program.id, program.course.title);
    }
  }

  // Search programs using FlexSearch
  let filteredPrograms = programs;
  if (searchQuery) {
    const results = index.search(decodeURIComponent(searchQuery));
    filteredPrograms = results.map(
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      (result) => programs.find((program) => program.id === result)!,
    );
  }

  // Pagination
  const paginationLimit = searchParams?.limit ? Number(searchParams.limit) : 25;
  const currentPage = searchParams?.page ? Number(searchParams.page) : 1;

  const paginatedPrograms = filteredPrograms.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return (
    <ProgramTableClient
      programs={paginatedPrograms}
      totalItems={filteredPrograms.length}
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
          <Heading>Programma's</Heading>
          <div className="mt-4 flex max-w-xl gap-4">
            <Search placeholder="Doorzoek programma's..." />
          </div>
        </div>
      </div>
      <ProgramTable searchParams={searchParams} />
    </>
  );
}
