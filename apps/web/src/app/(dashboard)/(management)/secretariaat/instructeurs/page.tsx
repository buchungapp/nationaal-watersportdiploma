import { User } from "@nawadi/core";
import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { getUserOrThrow } from "~/lib/nwd";
import { isSecretariaat } from "~/utils/auth/is-secretariaat";
import { isSystemAdmin } from "~/utils/auth/is-system-admin";
import Search from "../../_components/search";
import { FilterSelect } from "./_components/filter";
import Table from "./_components/table";

const searchParamsParser = createLoader({
  filter: parseAsArrayOf(
    parseAsStringLiteral(["instructor", "pvb_beoordelaar"] as const),
  ).withDefault(["instructor", "pvb_beoordelaar"]),
  query: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(25),
});

async function InstructeurTable(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const {
    filter,
    query,
    page: currentPage,
    limit: paginationLimit,
  } = searchParamsParser(searchParams ?? {});

  const persons = await User.Person.list({
    filter: {
      actorType: filter,
      q: query,
    },
    limit: paginationLimit,
    offset: (currentPage - 1) * paginationLimit,
  });

  return <Table persons={persons.items} totalItems={persons.count} />;
}

export default async function InstructeurPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getUserOrThrow();

  // Check if user is system admin or secretariaat
  if (!isSystemAdmin(user.email) && !isSecretariaat(user.email)) {
    return (
      <div className="mx-auto max-w-7xl">
        <Heading level={1}>Geen toegang</Heading>
        <Text className="mt-2">Je hebt geen toegang tot deze pagina.</Text>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <Heading level={1}>Instructeurs & Beoordelaars</Heading>
        <Text className="mt-2">
          Beheer alle instructeurs en PVB beoordelaars in het systeem. In de
          toekomst kunnen hier kwalificaties worden toegevoegd of verwijderd.
        </Text>
        <div className="flex gap-4 mt-4 max-w-xl">
          <Search placeholder="Zoek instructeur of beoordelaar..." />
          <FilterSelect />
        </div>
      </div>

      <Suspense
        fallback={<Table persons={[]} totalItems={0} placeholderRows={10} />}
      >
        <InstructeurTable searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
