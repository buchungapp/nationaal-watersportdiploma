import FlexSearch from "flexsearch";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { listCategories, listParentCategories } from "~/lib/nwd";
import Search from "../../../_components/search";
import CategoryTableCLient from "./_components/category-table";
import { CreateCategoryDialog } from "./_components/dialogs/create-category-dialog";

async function CategoryTable(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const [categories, parentCategories] = await Promise.all([
    listCategories(),
    listParentCategories(),
  ]);

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
      parentCategories={parentCategories}
      totalItems={filteredCategories.length}
    />
  );
}

async function CreateCategoryDialogSuspense() {
  const parentCategories = await listParentCategories();
  return <CreateCategoryDialog parentCategories={parentCategories} />;
}

export default function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <Heading level={1}>Categorieën</Heading>
      <div className="flex sm:flex-row flex-col justify-between gap-2 mt-4">
        <div className="flex items-center gap-2 w-full max-w-lg">
          <Search placeholder="Doorzoek categorieën..." />
        </div>
        <Suspense
          fallback={<div className="rounded-lg w-40.5 h-9 animate-pulse" />}
        >
          <CreateCategoryDialogSuspense />
        </Suspense>
      </div>
      <Suspense
        fallback={
          <CategoryTableCLient
            categories={[]}
            parentCategories={[]}
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
