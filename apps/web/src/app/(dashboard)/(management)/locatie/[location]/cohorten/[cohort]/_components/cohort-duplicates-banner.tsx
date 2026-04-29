import { listLocationDuplicatePairs } from "~/lib/nwd";
import { CohortDuplicatesBannerClient } from "./cohort-duplicates-banner-client";

// Server component that fetches duplicate pairs scoped to this cohort and
// hands them to the client banner. Rendered inside a <Suspense> boundary so
// the cohort page doesn't block on the pair query.
//
// Returns null when there are no duplicates — the banner stays absent until
// there's something to act on.

export async function CohortDuplicatesBanner({
  locationId,
  cohortId,
}: {
  locationId: string;
  cohortId: string;
}) {
  const pairs = await listLocationDuplicatePairs({
    locationId,
    cohortId,
    threshold: 150, // strong+ only — weak matches in a cohort would be too noisy
    limit: 50,
  });

  if (pairs.length === 0) return null;

  return (
    <CohortDuplicatesBannerClient
      pairs={pairs.map((p) => ({
        score: p.score,
        primary: p.primary,
        duplicate: p.duplicate,
      }))}
      locationId={locationId}
    />
  );
}
