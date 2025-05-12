import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  listRolesForLocation,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { CohortActionsClient } from "./quick-actions-client";

type CohortActionsProps = {
  params: Promise<{ location: string; cohort: string }>;
};

async function CohortActionsContent(props: CohortActionsProps) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);

  const [cohort, roles] = await Promise.all([
    retrieveCohortByHandle(params.cohort, location.id),
    listRolesForLocation(location.id),
  ]);

  if (!cohort) {
    notFound();
  }

  if (!roles.includes("location_admin")) {
    return null;
  }

  return <CohortActionsClient cohort={cohort} />;
}

export function CohortActions(props: CohortActionsProps) {
  return (
    <Suspense fallback={null}>
      <CohortActionsContent {...props} />
    </Suspense>
  );
}
