import { notFound } from "next/navigation";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import {
  listImportSessionsForCohort,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { ImportSessionsReview } from "./_components/import-sessions-review";

export default async function Page(props: {
  params: Promise<{ location: string; cohort: string }>;
}) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);
  const cohort = await retrieveCohortByHandle(params.cohort, location.id);

  if (!cohort) {
    notFound();
  }

  const sessions = await listImportSessionsForCohort(cohort.id);

  return (
    <div className="space-y-6">
      <div>
        <Heading level={2}>Imports</Heading>
        <Text>
          Buchung snapshots voor dit cohort, inclusief vervangen en verwerkte
          generaties.
        </Text>
      </div>

      <ImportSessionsReview
        sessions={sessions}
        locationId={location.id}
        cohortId={cohort.id}
        locationHandle={params.location}
        cohortHandle={params.cohort}
      />
    </div>
  );
}
