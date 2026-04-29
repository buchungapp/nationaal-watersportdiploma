import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { operatorIdentityWorkflowEnabled } from "~/lib/flags";
import { listLocationDuplicatePairs, retrieveLocationByHandle } from "~/lib/nwd";
import { DuplicatePairsList } from "./_components/DuplicatePairsList";

export const dynamic = "force-dynamic";

async function Pairs({ locationHandle }: { locationHandle: string }) {
  const location = await retrieveLocationByHandle(locationHandle);
  const pairs = await listLocationDuplicatePairs({
    locationId: location.id,
    threshold: 100,
    limit: 200,
  });
  return <DuplicatePairsList pairs={pairs} locationId={location.id} />;
}

export default async function Page(props: {
  params: Promise<{ location: string }>;
}) {
  // Gate behind operator-identity-workflow. When off, the route 404s
  // — same pattern as /leercoach pages so direct-link visits don't
  // leak the new UI to users who shouldn't see it yet.
  if (!(await operatorIdentityWorkflowEnabled())) notFound();

  const { location: locationHandle } = await props.params;
  return (
    <div>
      <Heading>Mogelijke duplicaten</Heading>
      <Text className="mt-2 max-w-2xl">
        Profielen in jouw locatie die op dezelfde persoon kunnen wijzen.
        Beoordeel een paar door op "Beoordeel" te klikken — je ziet daar de
        details en kunt samenvoegen.
      </Text>
      <div className="mt-6">
        <Suspense
          fallback={
            <Text className="!text-sm !text-zinc-600 dark:!text-zinc-400">
              Profielen worden vergeleken...
            </Text>
          }
        >
          <Pairs locationHandle={locationHandle} />
        </Suspense>
      </div>
    </div>
  );
}
