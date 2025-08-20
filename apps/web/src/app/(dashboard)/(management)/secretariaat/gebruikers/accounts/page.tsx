import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { listAccountsWithPagination } from "~/lib/nwd";
import Search from "../../../_components/search";
import Table from "./_components/table";
import { searchParamsParser } from "./_search-params";

export default function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <div className="mb-8">
        <Heading level={1}>Accounts beheer</Heading>
        <Text className="mt-2">Beheer accounts voor gebruikers.</Text>
      </div>

      <div className="mt-8">
        <div className="flex gap-4 mt-4 max-w-lg">
          <Search placeholder="Zoek account..." />
        </div>

        <Suspense
          fallback={<Table accounts={[]} totalItems={0} placeholderRows={10} />}
        >
          <AccountsTable searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function AccountsTable(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const {
    query,
    page: currentPage,
    limit: paginationLimit,
  } = searchParamsParser(searchParams ?? {});

  const accounts = await listAccountsWithPagination({
    filter: {
      q: query,
    },
    limit: paginationLimit,
    offset: (currentPage - 1) * paginationLimit,
  });

  return <Table accounts={accounts.items} totalItems={accounts.count} />;
}
