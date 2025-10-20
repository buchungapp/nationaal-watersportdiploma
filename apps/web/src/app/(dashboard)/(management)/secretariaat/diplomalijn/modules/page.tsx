import FlexSearch from "flexsearch";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listModules } from "~/lib/nwd";
import Search from "../../../_components/search";
import { CreateModuleDialog } from "./_components/dialogs/create-module-dialog";
import ModuleTableCLient from "./_components/module-table";

async function ModuleTable(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const modules = await listModules();
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
  for (const module of modules) {
    if (module.title) {
      index.add(module.id, module.title);
    }
  }

  // Search programs using FlexSearch
  let filteredModules = modules;
  if (searchQuery) {
    const results = index.search(decodeURIComponent(searchQuery));
    filteredModules = results.map(
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
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
    <ModuleTableCLient
      modules={paginatedModules}
      totalItems={filteredModules.length}
    />
  );
}

export default function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <Heading level={1}>Modules</Heading>
      <div className="flex sm:flex-row flex-col justify-between gap-2 mt-4">
        <div className="flex items-center gap-2 w-full max-w-lg">
          <Search placeholder="Doorzoek modules..." />
        </div>
        <CreateModuleDialog />
      </div>
      <Suspense
        fallback={
          <ModuleTableCLient modules={[]} totalItems={0} placeholderRows={4} />
        }
      >
        <ModuleTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
