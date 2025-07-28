import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProgressSection from "~/app/(dashboard)/(account)/profiel/[handle]/_components/progress/progress";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { getPersonById, getUserOrThrow } from "~/lib/nwd";
import { isSecretariaat } from "~/utils/auth/is-secretariaat";
import { isSystemAdmin } from "~/utils/auth/is-system-admin";
import { Personalia } from "./_components/personalia/personalia";

export default async function PersonPage({
  params,
}: {
  params: Promise<{ personId: string }>;
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

  const { personId } = await params;
  const personPromise = getPersonById(personId).catch(() => notFound());

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <Heading level={1}>Persoon beheren</Heading>
        <Text className="mt-2">
          Beheer de persoon. Bekijk diplomas, locaties en meer.
        </Text>
      </div>

      <div className="mb-8">
        <Link
          href="/secretariaat/gebruikers"
          className="inline-flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-900 text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Terug naar overzicht
        </Link>

        <div className="items-start gap-2 grid grid-cols-1 lg:grid-cols-3 grid-rows-1 mx-auto lg:mx-0 mt-2 lg:max-w-none max-w-2xl">
          <Suspense fallback={<div>Laden...</div>}>
            <div className="flex flex-col gap-2 order-3 lg:order-none lg:col-start-3 lg:row-end-1">
              <Personalia personPromise={personPromise} />
            </div>

            <div className="flex flex-col gap-2 order-2 lg:order-none lg:col-span-2 lg:row-span-2 lg:row-end-2">
              {/* @TODO: fix authorization for secretariaat to download certificates */}
              <ProgressSection
                description="Bekijk de diploma's, hoe deze persoon ervoor staat met zijn opleidingen, en hoe het gaat met de huidige cursus."
                personPromise={personPromise}
              />
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
