import { User } from "@nawadi/core";
import { createLoader, parseAsInteger, parseAsString } from "nuqs/server";
import { Suspense } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { isSystemAdmin } from "~/lib/authorization";
import { getUserOrThrow } from "~/lib/nwd";
import Search from "../../_components/search";
import MergePersonsDialog from "./_components/merge-persons-dialog";
import Table from "./_components/table";

const searchParamsParser = createLoader({
  query: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(25),
});

async function GebruikersTableData(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const {
    query,
    page: currentPage,
    limit: paginationLimit,
  } = searchParamsParser(searchParams ?? {});

  const persons = await User.Person.list({
    filter: {
      q: query || undefined,
    },
    limit: paginationLimit,
    offset: (currentPage - 1) * paginationLimit,
  });

  return <Table persons={persons.items} totalItems={persons.count} />;
}

export default async function GebruikersPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getUserOrThrow();

  if (!isSystemAdmin(user.email)) {
    return (
      <div className="mx-auto max-w-7xl">
        <Heading level={1}>Geen toegang</Heading>
        <Text className="mt-2">Je hebt geen toegang tot deze pagina.</Text>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Heading level={1}>Gebruikersbeheer</Heading>
          <Text className="mt-2">
            Beheer gebruikers en voeg duplicaten samen.
          </Text>
        </div>
        <Button href="?merge=true" color="branding-dark">
          Samenvoegen…
        </Button>
      </div>

      <div className="mt-4 max-w-xl">
        <Search placeholder="Zoek persoon…" />
      </div>

      <Suspense
        fallback={<Table persons={[]} totalItems={0} placeholderRows={10} />}
      >
        <GebruikersTableData searchParams={props.searchParams} />
      </Suspense>

      {/* Dialog rendered via URL state */}
      <MergePersonsDialog />
    </div>
  );
}
