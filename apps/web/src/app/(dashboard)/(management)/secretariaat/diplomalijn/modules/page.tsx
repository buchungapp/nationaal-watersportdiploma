import FlexSearch from "flexsearch";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listModules } from "~/lib/nwd";
import Search from "../../../_components/search";
import EditDialog from "./_components/edit-dialog";
import ModuleTableCLient from "./_components/module-table";

async function ModuleTable({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const modules = await listModules();
  const searchQuery = searchParams?.query?.toString() ?? null;

  const editModuleId = searchParams?.bewerken?.toString() ?? null;
  const editModule =
    modules.find((module) => module.id === editModuleId) ?? null;

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
  modules.forEach((module) => {
    index.add(module.id, module.title!);
  });

  // Search programs using FlexSearch
  let filteredModules = modules;
  if (searchQuery) {
    const results = index.search(decodeURIComponent(searchQuery));
    filteredModules = results.map(
      (result) => modules.find((module) => module.id === result)!,
    );
  }

  // Pagination
  const paginationLimit = searchParams?.limit ? Number(searchParams.limit) : 25;
  const currentPage = searchParams?.page ? Number(searchParams.page) : 1;

  const paginatedModules = filteredModules.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return (
    <>
      <ModuleTableCLient
        modules={paginatedModules}
        totalItems={filteredModules.length}
      />
      <EditDialog key={editModule?.id} editModule={editModule} />
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
          <Heading>Modules</Heading>
          <div className="mt-4 flex max-w-xl gap-4">
            <Search placeholder="Doorzoek modules..." />
          </div>
        </div>
      </div>
      <ModuleTable searchParams={searchParams} />
    </>
  );
}
