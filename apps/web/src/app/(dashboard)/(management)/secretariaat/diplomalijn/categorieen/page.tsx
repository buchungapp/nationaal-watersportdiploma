import FlexSearch from "flexsearch";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listCategories } from "~/lib/nwd";
import Search from "../../../_components/search";
import CategoryTableCLient from "./_components/category-table";

async function CategoryTable(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const categories = await listCategories();
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
  for (const category of categories) {
    if (category.title) {
      index.add(category.id, category.title);
    }
  }

  // Search programs using FlexSearch
  let filteredCategories = categories;
  if (searchQuery) {
    const results = index.search(decodeURIComponent(searchQuery));
    filteredCategories = results.map(
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      (result) => categories.find((category) => category.id === result)!,
    );
  }

  // Pagination
  const paginationLimit = searchParams?.limit ? Number(searchParams.limit) : 25;
  const currentPage = searchParams?.page ? Number(searchParams.page) : 1;

  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return (
    <CategoryTableCLient
      categories={paginatedCategories}
      totalItems={filteredCategories.length}
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
          <Heading>Categorieën</Heading>
          <div className="flex gap-4 mt-4 max-w-xl">
            <Search placeholder="Doorzoek categorieën..." />
          </div>
        </div>
      </div>
      <Suspense
        fallback={
          <CategoryTableCLient
            categories={[]}
            totalItems={0}
            placeholderRows={4}
          />
        }
      >
        <CategoryTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
