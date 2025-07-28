import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import type { User } from "@nawadi/core";
import Link from "next/link";
import { Code } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";

type Person = Awaited<ReturnType<typeof User.Person.byIdOrHandle>>;

export function PersonInfo({ person }: { person: Person }) {
  return (
    <div className="mb-8">
      <Link
        href="/secretariaat/instructeurs"
        className="inline-flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-900 text-sm"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Terug naar overzicht
      </Link>

      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-5">
          <h3 className="font-medium text-gray-900 dark:text-white text-lg leading-6">
            Persoonsinformatie
          </h3>
        </div>
        <div className="border-gray-200 dark:border-gray-700 border-t">
          <dl className="divide-y divide-gray-200 dark:divide-gray-700">
            <div className="sm:gap-4 sm:grid sm:grid-cols-3 px-4 sm:px-6 py-4">
              <dt className="font-medium text-gray-500 dark:text-gray-400 text-sm">
                Naam
              </dt>
              <dd className="sm:col-span-2 mt-1 sm:mt-0 text-gray-900 dark:text-gray-100 text-sm">
                {[person.firstName, person.lastNamePrefix, person.lastName]
                  .filter(Boolean)
                  .join(" ")}
              </dd>
            </div>
            <div className="sm:gap-4 sm:grid sm:grid-cols-3 px-4 sm:px-6 py-4">
              <dt className="font-medium text-gray-500 dark:text-gray-400 text-sm">
                NWD-id
              </dt>
              <dd className="sm:col-span-2 mt-1 sm:mt-0 text-gray-900 dark:text-gray-100 text-sm">
                <Code>{person.handle}</Code>
              </dd>
            </div>
            <div className="sm:gap-4 sm:grid sm:grid-cols-3 px-4 sm:px-6 py-4">
              <dt className="font-medium text-gray-500 dark:text-gray-400 text-sm">
                E-mailadres
              </dt>
              <dd className="sm:col-span-2 mt-1 sm:mt-0 text-gray-900 dark:text-gray-100 text-sm">
                {person.email || "-"}
              </dd>
            </div>
            <div className="sm:gap-4 sm:grid sm:grid-cols-3 px-4 sm:px-6 py-4">
              <dt className="font-medium text-gray-500 dark:text-gray-400 text-sm">
                Geboortedatum
              </dt>
              <dd className="sm:col-span-2 mt-1 sm:mt-0 text-gray-900 dark:text-gray-100 text-sm">
                {person.dateOfBirth
                  ? dayjs(person.dateOfBirth).format("DD-MM-YYYY")
                  : "-"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
