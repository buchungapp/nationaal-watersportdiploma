import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { getUserById } from "~/lib/nwd";
import { Personalia } from "./_components/personalia/personalia";
import { Persons } from "./_components/persons/persons";

export default async function PersonPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const userPromise = getUserById(userId).catch(() => notFound());

  return (
    <>
      <Heading level={1}>Account beheren</Heading>
      <Text className="mt-2">Beheer het account. Bekijk personen.</Text>

      <Link
        href="/secretariaat/gebruikers/accounts"
        className="inline-flex items-center gap-2 my-4 text-gray-600 hover:text-gray-900 text-sm"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Terug naar overzicht
      </Link>

      <div className="bg-zinc-100 -mx-2 p-2 rounded-xl">
        <div className="items-start gap-2 grid grid-cols-1 lg:grid-cols-3 grid-rows-1 mx-auto lg:mx-0 lg:max-w-none max-w-2xl">
          <div className="flex flex-col gap-2 order-3 lg:order-none lg:col-start-3 lg:row-end-1">
            <Personalia userPromise={userPromise} />
          </div>
          <div className="flex flex-col gap-2 order-2 lg:order-none lg:col-span-2 lg:row-span-2 lg:row-end-2">
            <Persons userPromise={userPromise} />
          </div>
        </div>
      </div>
    </>
  );
}
