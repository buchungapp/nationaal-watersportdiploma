import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { getUserOrThrow } from "~/lib/nwd";

export default async function UsersPage() {
  const user = await getUserOrThrow();

  // Check if user is system admin
  const isSystemAdmin = user.email === "maurits@buchung.nl";

  if (!isSystemAdmin) {
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
          Beheer gebruikers en start impersonatie sessies. Kopieer een
          gebruikers-ID en gebruik de impersonatie balk bovenaan de pagina.
        </Text>
      </div>

      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Huidige gebruiker
            </h3>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Naam
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {user.displayName || "Geen naam"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  E-mail
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {user.email}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Gebruikers-ID
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {user.authUserId}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {user._impersonation?.isImpersonating ? (
                    <span className="text-orange-600 font-medium">
                      Impersonatie actief (originele ID:{" "}
                      {user._impersonation.originalUserId})
                    </span>
                  ) : (
                    <span className="text-green-600 font-medium">
                      Normale sessie
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8">
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Tip: Om een gebruiker te impersoneren, kopieer hun gebruikers-ID en
            gebruik de impersonatie balk bovenaan de pagina.
          </Text>
        </div>
      </div>
    </div>
  );
}
