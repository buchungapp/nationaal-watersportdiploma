import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { getUserOrThrow, listPersonsWithPagination } from "~/lib/nwd";
import { isSecretariaat } from "~/utils/auth/is-secretariaat";
import { isSystemAdmin } from "~/utils/auth/is-system-admin";
import Search from "../../_components/search";
import { FilterSelect } from "./_components/filter";
import Table from "./_components/table";
import { searchParamsParser } from "./_search-params";

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getUserOrThrow();

  const isCurrentUserSystemAdmin = isSystemAdmin(user.email);
  const isCurrentUserSecretariaat = isSecretariaat(user.email);

  // Check if user is system admin or secretariaat
  if (!isCurrentUserSystemAdmin && !isCurrentUserSecretariaat) {
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
        <Heading level={1}>Gebruikersbeheer</Heading>
        <Text className="mt-2">
          {isCurrentUserSystemAdmin
            ? "Beheer gebruikers en start impersonatie sessies. Kopieer een gebruikers-ID en gebruik de impersonatie balk bovenaan de pagina."
            : "Beheer gebruikers"}
        </Text>
      </div>
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-md overflow-hidden">
          <div className="px-4 sm:px-6 py-5">
            <h3 className="font-medium text-gray-900 dark:text-white text-lg leading-6">
              Huidige gebruiker
            </h3>
          </div>
          <div className="px-4 sm:px-6 py-5 border-gray-200 dark:border-gray-700 border-t">
            <dl className="gap-x-4 gap-y-6 grid grid-cols-1 sm:grid-cols-2">
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400 text-sm">
                  Naam
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100 text-sm">
                  {user.displayName || "Geen naam"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400 text-sm">
                  E-mail
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100 text-sm">
                  {user.email}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400 text-sm">
                  Gebruikers-ID
                </dt>
                <dd className="mt-1 font-mono text-gray-900 dark:text-gray-100 text-sm">
                  {user.authUserId}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400 text-sm">
                  Status
                </dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100 text-sm">
                  {user._impersonation?.isImpersonating ? (
                    <span className="font-medium text-orange-600">
                      Impersonatie actief (originele ID:{" "}
                      {user._impersonation.originalUserId})
                    </span>
                  ) : (
                    <span className="font-medium text-green-600">
                      Normale sessie
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <Text className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
          Tip: Om een gebruiker te impersoneren, kopieer hun gebruikers-ID en
          gebruik de impersonatie balk bovenaan de pagina.
        </Text>
      </div>

      <div className="mt-8">
        <div className="flex gap-4 mt-4 max-w-xl">
          <Search placeholder="Zoek persoon..." />
          <FilterSelect />
        </div>

        <Suspense
          fallback={<Table persons={[]} totalItems={0} placeholderRows={10} />}
        >
          <PersonsTable searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function PersonsTable(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const {
    filter,
    query,
    page: currentPage,
    limit: paginationLimit,
  } = searchParamsParser(searchParams ?? {});

  const persons = await listPersonsWithPagination({
    filter: {
      actorType: filter,
      q: query,
    },
    limit: paginationLimit,
    offset: (currentPage - 1) * paginationLimit,
  });

  return <Table persons={persons.items} totalItems={persons.count} />;
}
