import FlexSearch from "flexsearch";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listCategories } from "~/lib/nwd";
import Search from "../../../_components/search";
import CategoryTableCLient from "./_components/category-table";

async function CategoryTable({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
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
  categories.forEach((category) => {
    index.add(category.id, category.title!);
  });

  // Search programs using FlexSearch
  let filteredCategories = categories;
  if (searchQuery) {
    const results = index.search(searchQuery);
    filteredCategories = results.map(
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

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Categorieën</Heading>
          <div className="mt-4 flex max-w-xl gap-4">
            <Search placeholder="Doorzoek categorieën..." />
          </div>
        </div>
      </div>
      <CategoryTable searchParams={searchParams} />
    </>
  );
}
