import NextLink from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
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

  return <LayoutTabsClient personRoles={roles} personPrivileges={privileges} />;
}

function LayoutTabsFallback() {
  return (
    <nav
      className="flex space-x-6 overflow-auto text-sm scrollbar-none"
      aria-label="Tabs"
    >
      {[
        {
          name: "Cursisten",
        },
        {
          name: "Diploma's",
        },
        {
          name: "Instructeurs",
        },
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
