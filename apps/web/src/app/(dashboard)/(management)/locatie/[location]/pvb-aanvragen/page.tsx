import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { listPvbs, retrieveLocationByHandle } from "~/lib/nwd";
import PvbTable from "./_components/table";

interface Props {
  params: Promise<{
    location: string;
  }>;
  searchParams: Promise<{
    q?: string;
    limit?: string;
    offset?: string;
  }>;
}

async function PvbAanvragenContent({ params, searchParams }: Props) {
  const { location: locationHandle } = await params;
  const { q, limit: limitParam, offset: offsetParam } = await searchParams;

  const limit = limitParam ? parseInt(limitParam, 10) : 50;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  const location = await retrieveLocationByHandle(locationHandle);

  if (!location) {
    notFound();
  }

  const { items: pvbs, totalCount } = await listPvbs(location.id, {
    q,
    limit,
    offset,
  });

  return (
    <div className="max-w-6xl">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Heading>PvB-aanvragen</Heading>
          <Subheading>
            Overzicht van alle Proeven van Bekwaamheid aanvragen voor{" "}
            {location.name}
          </Subheading>
        </div>
      </div>

      <Text className="mt-4 text-zinc-500">
        Beheer PvB-aanvragen, plan examens en volg de voortgang van kandidaten.
      </Text>

      <PvbTable pvbs={pvbs} totalItems={totalCount} placeholderRows={limit} />
    </div>
  );
}

export default function PvbAanvragenPage(props: Props) {
  return (
    <Suspense fallback={<div>Laden...</div>}>
      <PvbAanvragenContent {...props} />
    </Suspense>
  );
}
