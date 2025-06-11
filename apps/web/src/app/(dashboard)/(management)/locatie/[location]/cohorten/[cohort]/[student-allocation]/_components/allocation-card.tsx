import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list-v2";
import { Code, Strong, TextLink } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import {
  isInstructorInCohort,
  listDistinctTagsForCohort,
  listPrivilegesForCohort,
  listRolesForLocation,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
  retrieveStudentAllocationWithCurriculum,
} from "~/lib/nwd";
import {
  ClaimInstructorAllocation,
  ReleaseInstructorAllocation,
} from "./actions";
import { UpdateProgressVisibility } from "./progress";
import { ManageAllocationTags } from "./tag-input";

type AllocationCardProps = {
  params: Promise<{
    location: string;
    cohort: string;
    "student-allocation": string;
  }>;
};

async function InstructorField({
  cohortId,
  studentAllocationId,
  locationId,
}: {
  cohortId: string;
  studentAllocationId: string;
  locationId: string;
}) {
  const [allocation, locationRoles, instructorAllocation, privileges] =
    await Promise.all([
      retrieveStudentAllocationWithCurriculum(cohortId, studentAllocationId),
      listRolesForLocation(locationId),
      isInstructorInCohort(cohortId),
      listPrivilegesForCohort(cohortId),
    ]);

  if (!allocation) {
    notFound();
  }

  const { instructor } = allocation;
  const isInstructor = !!instructorAllocation;
  const canManageInstructors =
    locationRoles.includes("location_admin") ||
    privileges.includes("manage_cohort_instructors");

  if (!instructor && isInstructor) {
    return (
      <ClaimInstructorAllocation
        cohortId={cohortId}
        studentAllocationId={studentAllocationId}
      />
    );
  }

  if (!instructor) {
    return null;
  }

  const instructorName = [
    instructor.firstName,
    instructor.lastNamePrefix,
    instructor.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const showRemoveButton =
    (isInstructor && instructor.id === instructorAllocation?.allocationId) ||
    canManageInstructors;

  return (
    <div className="flex justify-between items-center gap-x-2">
      <span className="whitespace-pre-line">{instructorName}</span>
      {showRemoveButton && (
        <ReleaseInstructorAllocation
          cohortId={cohortId}
          studentAllocationId={studentAllocationId}
        />
      )}
    </div>
  );
}

async function TagsField({
  cohortId,
  studentAllocationId,
  locationId,
}: {
  cohortId: string;
  studentAllocationId: string;
  locationId: string;
}) {
  const [allocation, locationRoles, privileges, allCohortTags] =
    await Promise.all([
      retrieveStudentAllocationWithCurriculum(cohortId, studentAllocationId),
      listRolesForLocation(locationId),
      listPrivilegesForCohort(cohortId),
      listDistinctTagsForCohort(cohortId),
    ]);

  if (!allocation) {
    notFound();
  }

  const canManageStudents =
    locationRoles.includes("location_admin") ||
    privileges.includes("manage_cohort_students");

  if (!canManageStudents) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2.5">
        {allocation.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
    );
  }

  return (
    <ManageAllocationTags
      tags={allocation.tags}
      cohortId={cohortId}
      allocationId={studentAllocationId}
      allCohortTags={allCohortTags}
    />
  );
}

async function AllocationCardContent(props: AllocationCardProps) {
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

  return (
    <DescriptionList>
      <DescriptionTerm>NWD-id</DescriptionTerm>
      <DescriptionDetails>
        <Code>{allocation.person.handle}</Code>
      </DescriptionDetails>

      <DescriptionTerm>Naam</DescriptionTerm>
      <DescriptionDetails>
        <TextLink
          href={`/locatie/${location.handle}/personen/${allocation.person.id}`}
          className="flex items-center gap-1"
        >
          <Strong>
            {[
              allocation.person.firstName,
              allocation.person.lastNamePrefix,
              allocation.person.lastName,
            ]
              .filter(Boolean)
              .join(" ")}
          </Strong>
          <ArrowTopRightOnSquareIcon className="size-4" />
        </TextLink>
      </DescriptionDetails>

      <DescriptionTerm>Leeftijd</DescriptionTerm>
      <DescriptionDetails>
        {allocation.person.dateOfBirth ? (
          <span>
            {`${dayjs().diff(dayjs(allocation.person.dateOfBirth), "year")} jr.`}{" "}
            <span className="text-zinc-500">{`(${dayjs(allocation.person.dateOfBirth).format("DD-MM-YYYY")})`}</span>
          </span>
        ) : null}
      </DescriptionDetails>

      <DescriptionTerm>Cohort</DescriptionTerm>
      <DescriptionDetails>{cohort.label}</DescriptionDetails>

      <DescriptionTerm>Instructeur</DescriptionTerm>
      <DescriptionDetails>
        <Suspense
          fallback={
            allocation.instructor
              ? [
                  allocation.instructor.firstName,
                  allocation.instructor.lastNamePrefix,
                  allocation.instructor.lastName,
                ]
                  .filter(Boolean)
                  .join(" ")
              : null
          }
        >
          <InstructorField
            locationId={location.id}
            cohortId={cohort.id}
            studentAllocationId={allocation.id}
          />
        </Suspense>
      </DescriptionDetails>

      <DescriptionTerm>Voortgang zichtbaar tot</DescriptionTerm>
      <DescriptionDetails className="flex justify-between items-center gap-x-2">
        {allocation.progressVisibleForStudentUpUntil ? (
          dayjs(allocation.progressVisibleForStudentUpUntil)
            .tz()
            .format("DD-MM-YYYY HH:mm")
        ) : (
          <>
            <span className="text-zinc-500">Niet zichtbaar</span>
          </>
        )}
        <div className="-my-2">
          <UpdateProgressVisibility
            allocationId={allocation.id}
            cohortId={cohort.id}
          />
        </div>
      </DescriptionDetails>

      <DescriptionTerm>Tags</DescriptionTerm>
      <DescriptionDetails>
        <Suspense
          fallback={
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2.5">
              {allocation.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          }
        >
          <TagsField
            locationId={location.id}
            cohortId={cohort.id}
            studentAllocationId={allocation.id}
          />
        </Suspense>
      </DescriptionDetails>
    </DescriptionList>
  );
}

export function AllocationCardFallback() {
  return (
    <DescriptionList>
      <DescriptionTerm>NWD-id</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded w-24 h-4 align-middle animate-pulse" />
      </DescriptionDetails>

      <DescriptionTerm>Naam</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded w-48 h-4 align-middle animate-pulse" />
      </DescriptionDetails>

      <DescriptionTerm>Leeftijd</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded w-16 h-4 align-middle animate-pulse" />
      </DescriptionDetails>

      <DescriptionTerm>Cohort</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded w-32 h-4 align-middle animate-pulse" />
      </DescriptionDetails>

      <DescriptionTerm>Instructeur</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded w-40 h-4 align-middle animate-pulse" />
      </DescriptionDetails>

      <DescriptionTerm>Voortgang zichtbaar tot</DescriptionTerm>
      <DescriptionDetails>
        <span className="bg-gray-200 rounded w-36 h-4 animate-pulse" />
      </DescriptionDetails>

      <DescriptionTerm>Tags</DescriptionTerm>
      <DescriptionDetails>
        <div className="flex gap-2">
          <span className="inline-block bg-gray-200 rounded w-16 h-6 align-middle animate-pulse" />
          <span className="inline-block bg-gray-200 rounded w-20 h-6 align-middle animate-pulse" />
        </div>
      </DescriptionDetails>
    </DescriptionList>
  );
}

export function AllocationCard(props: AllocationCardProps) {
  return (
    <Suspense fallback={<AllocationCardFallback />}>
      <AllocationCardContent {...props} />
    </Suspense>
  );
}
