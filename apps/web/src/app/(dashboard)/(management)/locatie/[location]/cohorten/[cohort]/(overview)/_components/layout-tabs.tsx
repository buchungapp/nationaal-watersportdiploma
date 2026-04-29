import NextLink from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  listLocationDuplicatePairs,
  listPrivilegesForCohort,
  listRolesForLocation,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { LayoutTabsClient } from "./layout-tabs-client";

type Props = { params: Promise<{ location: string; cohort: string }> };

async function LayoutTabsContent(props: Props) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);
  const cohort = await retrieveCohortByHandle(params.cohort, location.id);

  if (!cohort) {
    notFound();
  }

  const [roles, privileges] = await Promise.all([
    listRolesForLocation(location.id),
    listPrivilegesForCohort(cohort.id),
  ]);

  // Only location_admins can act on duplicates, so only they need the
  // count. Fetched here (not in page.tsx) so the dot indicator on the
  // Duplicaten tab is consistent across all four sub-routes — Cursisten,
  // Diploma's, Instructeurs, Duplicaten.
  const duplicatesCount = roles.includes("location_admin")
    ? await listLocationDuplicatePairs({
        locationId: location.id,
        cohortId: cohort.id,
        threshold: 150,
        limit: 50,
      }).then((pairs) => pairs.length)
    : 0;

  return (
    <LayoutTabsClient
      personRoles={roles}
      personPrivileges={privileges}
      duplicatesCount={duplicatesCount}
    />
  );
}

export function LayoutTabsFallback() {
  return (
    <nav
      className="flex space-x-6 overflow-auto text-sm scrollbar-none"
      aria-label="Tabs"
    >
      {/* TODO: href="#" is not a nice solution, but it works for now */}
      {[
        { name: "Cursisten" },
        { name: "Diploma's" },
        { name: "Instructeurs" },
        { name: "Duplicaten" },
      ].map((tab) => (
        <NextLink
          key={tab.name}
          href="#"
          className="px-3 py-2 rounded-md font-medium text-slate-500 hover:text-slate-700 text-sm"
        >
          {tab.name}
        </NextLink>
      ))}
    </nav>
  );
}

export function LayoutTabs(props: Props) {
  return (
    <Suspense fallback={<LayoutTabsFallback />}>
      <LayoutTabsContent {...props} />
    </Suspense>
  );
}
