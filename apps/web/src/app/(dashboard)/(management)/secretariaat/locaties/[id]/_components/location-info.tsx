import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { Code, Text, TextLink } from "~/app/(dashboard)/_components/text";
import type { retrieveLocationByIdAsAdmin } from "~/lib/nwd";

type Location = Awaited<ReturnType<typeof retrieveLocationByIdAsAdmin>>;

export function LocationInfo({ location }: { location: Location }) {
  return (
    <div className="mb-8">
      <Link
        href="/secretariaat/locaties"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Terug naar overzicht
      </Link>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            {location.name ?? "Naamloze locatie"}
          </h3>
          <Text className="mt-1 text-sm">
            Handle: <Code>{location.handle}</Code>
          </Text>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <dl className="divide-y divide-gray-200 dark:divide-gray-700">
            {location.websiteUrl ? (
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Website
                </dt>
                <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                  <TextLink href={location.websiteUrl} target="_blank">
                    {location.websiteUrl}
                  </TextLink>
                </dd>
              </div>
            ) : null}
            {location.email ? (
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  E-mail
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
                  {location.email}
                </dd>
              </div>
            ) : null}
            {location.shortDescription ? (
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Omschrijving
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
                  {location.shortDescription}
                </dd>
              </div>
            ) : null}
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Links
              </dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2 flex flex-wrap gap-x-4 gap-y-1">
                <TextLink href="/vaarlocaties" target="_blank">
                  Publieke pagina
                </TextLink>
                <TextLink
                  href={`/locatie/${location.handle}/cohorten`}
                  target="_blank"
                >
                  Operator-dashboard
                </TextLink>
                <TextLink
                  href={`/locatie/${location.handle}/instellingen`}
                  target="_blank"
                >
                  Instellingen
                </TextLink>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
