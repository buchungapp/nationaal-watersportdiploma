import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { operatorIdentityWorkflowEnabled } from "~/lib/flags";
import {
  listLocationDuplicatePairs,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { DuplicatePairsList } from "../../../../personen/duplicaten/_components/DuplicatePairsList";

export const dynamic = "force-dynamic";

// Mirrors the location-wide duplicates view but scoped to persons
// allocated to THIS cohort. Powered by the same pair-finder via
// listDuplicatePairsInLocation({ cohortId }) — server-side already
// constrains pairs to ones where both persons are in the cohort.
//
// IMPORTANT: this surfaces possible-duplicate PERSONS (distinct Person
// rows that may be the same human), not duplicate cohort_allocations.
// One person doing multiple curricula in the same cohort is a valid
// allocation pattern — we don't flag it.

async function Pairs({
  locationHandle,
  cohortHandle,
}: {
  locationHandle: string;
  cohortHandle: string;
}) {
  const location = await retrieveLocationByHandle(locationHandle);
  const cohort = await retrieveCohortByHandle(cohortHandle, location.id);
  if (!cohort) {
    notFound();
  }
  const pairs = await listLocationDuplicatePairs({
    locationId: location.id,
    cohortId: cohort.id,
    threshold: 100,
    limit: 200,
  });
  return (
    <DuplicatePairsList
      pairs={pairs}
      locationId={location.id}
      scope="cohort"
    />
  );
}

export default async function Page(props: {
  params: Promise<{ location: string; cohort: string }>;
}) {
  // Same gate as /personen/duplicaten — feature flag off means this
  // route 404s.
  if (!(await operatorIdentityWorkflowEnabled())) notFound();

  const { location: locationHandle, cohort: cohortHandle } =
    await props.params;
  return (
    <div>
      <Heading>Mogelijke duplicaten in dit cohort</Heading>
      <Text className="mt-2 max-w-2xl">
        Verschillende profielen die in dit cohort zitten en mogelijk
        dezelfde persoon zijn. Beoordeel een paar door op "Beoordeel" te
        klikken — je ziet daar de details en kunt samenvoegen.
      </Text>
      <Text className="mt-2 max-w-2xl !text-xs !text-zinc-500">
        Let op: dit gaat over dubbele <strong>profielen</strong>, niet
        over een persoon die meerdere curricula in dit cohort doet — dat
        is normaal en wordt hier niet getoond.
      </Text>
      <div className="mt-6">
        <Suspense
          fallback={
            <Text className="!text-sm !text-zinc-600 dark:!text-zinc-400">
              Profielen worden vergeleken...
            </Text>
          }
        >
          <Pairs
            locationHandle={locationHandle}
            cohortHandle={cohortHandle}
          />
        </Suspense>
      </div>
    </div>
  );
}
