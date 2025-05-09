import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  listCohortsForLocation,
  listPrivilegesForCohort,
  listRolesForLocation,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
  retrieveStudentAllocationWithCurriculum,
} from "~/lib/nwd";
import { filterCohorts } from "~/utils/filter-cohorts";
import ManageStudentActionsDropdown from "./manage-student-actions-dropdown";

type ManageStudentActionsProps = {
  params: Promise<{
    location: string;
    cohort: string;
    "student-allocation": string;
  }>;
};

async function ManageStudentActionsContent(props: ManageStudentActionsProps) {
  const params = await props.params;

  const location = await retrieveLocationByHandle(params.location);
  const cohort = await retrieveCohortByHandle(params.cohort, location.id);

  if (!cohort) {
    notFound();
  }

  const allocation = await retrieveStudentAllocationWithCurriculum(
    cohort.id,
    params["student-allocation"],
  );

  if (!allocation) {
    notFound();
  }

  const [locationRoles, privileges, filteredCohorts] = await Promise.all([
    listRolesForLocation(location.id),
    listPrivilegesForCohort(cohort.id),
    listCohortsForLocation(location.id).then((cohorts) =>
      filterCohorts(cohorts, ["open", "aankomend"]),
    ),
  ]);

  const canManageStudent =
    locationRoles.includes("location_admin") ||
    privileges.includes("manage_cohort_students");

  if (!canManageStudent) {
    return null;
  }

  if (!allocation) {
    throw new Error("Student allocation not found");
  }

  return (
    <ManageStudentActionsDropdown
      cohortId={cohort.id}
      studentAllocationId={allocation.id}
      locationId={location.id}
      personId={allocation.person.id}
      cohorts={filteredCohorts}
      canMoveStudentAllocation={!allocation.certificate}
    />
  );
}

export function ManageStudentActionsFallback() {
  return (
    <div className="flex items-center gap-1 -my-1.5 animate-pulse shrink-0">
      <div className="bg-slate-200 rounded-lg size-9" />
    </div>
  );
}

export function ManageStudentActions(props: ManageStudentActionsProps) {
  return (
    <Suspense fallback={<ManageStudentActionsFallback />}>
      <ManageStudentActionsContent {...props} />
    </Suspense>
  );
}
