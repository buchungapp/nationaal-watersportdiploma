import {
  ArrowTopRightOnSquareIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/16/solid";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SWRConfig } from "swr";
import { Badge } from "~/app/(dashboard)/_components/badge";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { RouterPreviousButton } from "~/app/(dashboard)/_components/navigation";
import { Code, Strong, TextLink } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { showAllocationTimeline, showProgressTracking } from "~/lib/flags";
import {
  isInstructorInCohort,
  listCohortsForLocation,
  listCompetencyProgressInCohortForStudent,
  listDistinctTagsForCohort,
  listPrivilegesForCohort,
  listPrograms,
  listRolesForLocation,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
  retrieveStudentAllocationWithCurriculum,
} from "~/lib/nwd";
import { filterCohorts } from "~/utils/filter-cohorts";
import {
  ClaimInstructorAllocation,
  ReleaseInstructorAllocation,
  WithdrawStudentCurriculum,
} from "./_components/actions";
import { CourseCard } from "./_components/course-card";
import ManageStudentActionsDropdown from "./_components/manage-student-actions-dropdown";
import { UpdateProgressVisibility } from "./_components/progress";
import { ManageAllocationTags } from "./_components/tag-input";
import Timeline from "./_components/timeline";

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
    <div className="flex items-center justify-between gap-x-2">
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
      <div className="flex flex-wrap gap-y-2.5 gap-x-2 items-center">
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

async function ManageStudentActions({
  cohortId,
  studentAllocationId,
  locationId,
  personId,
}: {
  cohortId: string;
  studentAllocationId: string;
  locationId: string;
  personId: string;
}) {
  const [locationRoles, privileges, filteredCohorts, allocation] =
    await Promise.all([
      listRolesForLocation(locationId),
      listPrivilegesForCohort(cohortId),
      listCohortsForLocation(locationId).then((cohorts) =>
        filterCohorts(cohorts, ["open", "aankomend"]),
      ),
      retrieveStudentAllocationWithCurriculum(cohortId, studentAllocationId),
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
      cohortId={cohortId}
      studentAllocationId={studentAllocationId}
      locationId={locationId}
      personId={personId}
      cohorts={filteredCohorts}
      canMoveStudentAllocation={!allocation.certificate}
    />
  );
}

async function ManageStudentCurriculumActions({
  cohortId,
  studentAllocationId,
  locationId,
}: {
  cohortId: string;
  studentAllocationId: string;
  locationId: string;
}) {
  const [allocation, progress] = await Promise.all([
    retrieveStudentAllocationWithCurriculum(cohortId, studentAllocationId),
    listCompetencyProgressInCohortForStudent(studentAllocationId),
  ]);

  if (!studentAllocationId) {
    notFound();
  }

  if (!allocation?.studentCurriculum) {
    return null;
  }

  const notNullProgress = progress.filter((p) => Number(p.progress) > 0);

  return (
    <Dropdown>
      <DropdownButton outline className="-my-1.5">
        <EllipsisHorizontalIcon />
      </DropdownButton>
      <DropdownMenu anchor="bottom end">
        <WithdrawStudentCurriculum
          cohortId={cohortId}
          studentAllocationId={studentAllocationId}
          locationId={locationId}
          disabled={!!allocation.certificate || notNullProgress.length > 0}
        />
      </DropdownMenu>
    </Dropdown>
  );
}

export default async function Page(props: {
  params: Promise<{
    location: string;
    cohort: string;
    "student-allocation": string;
  }>;
}) {
  const params = await props.params;
  // Kick-off the flag evaluation
  const showTimelineFlag = showAllocationTimeline();
  const showProgressTrackingFlag = showProgressTracking.run({
    identify: params,
  });

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
    <SWRConfig
      value={{
        fallback: {
          // Note that there is no `await` here,
          // so it only blocks rendering of components that
          // actually rely on this data.
          allPrograms: listPrograms(),
        },
      }}
    >
      <div className="max-lg:hidden">
        <RouterPreviousButton>Overzicht</RouterPreviousButton>
      </div>

      <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 grid-rows-1 items-start gap-x-8 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        <div className="lg:col-start-3 lg:row-end-1">
          <div className="flex items-center justify-between">
            <Subheading>Cursist</Subheading>
            <Suspense fallback={null}>
              <ManageStudentActions
                locationId={location.id}
                cohortId={cohort.id}
                studentAllocationId={allocation.id}
                personId={allocation.person.id}
              />
            </Suspense>
          </div>
          <Divider className="mt-4" />
          <DescriptionList>
            <DescriptionTerm>NWD-id</DescriptionTerm>
            <DescriptionDetails>
              <Code>{allocation.person.handle}</Code>
            </DescriptionDetails>

            <DescriptionTerm>Naam</DescriptionTerm>
            <DescriptionDetails>
              <TextLink
                href={`/locatie/${location.handle}/personen/${allocation.person.id}`}
                className="flex gap-1 items-center"
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

            {(await showProgressTrackingFlag) ? (
              <>
                <DescriptionTerm>Voortgang zichtbaar tot</DescriptionTerm>
                <DescriptionDetails className="flex items-center justify-between gap-x-2">
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
              </>
            ) : null}

            <DescriptionTerm>Tags</DescriptionTerm>
            <DescriptionDetails>
              <Suspense
                fallback={
                  <div className="flex flex-wrap gap-y-2.5 gap-x-2 items-center">
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
        </div>
        {(await showTimelineFlag) ? (
          <div className="lg:col-start-3 lg:row-start-1">
            <div className="flex items-center justify-between">
              <Subheading>Tijdlijn</Subheading>
            </div>
            <Divider className="mt-4" />
            <Timeline cohortId={cohort.id} allocationId={allocation.id} />
          </div>
        ) : null}

        <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2">
          <div className="flex items-center justify-between">
            <Subheading>Cursuskaart</Subheading>
            <Suspense fallback={null}>
              <ManageStudentCurriculumActions
                locationId={location.id}
                cohortId={cohort.id}
                studentAllocationId={allocation.id}
              />
            </Suspense>
          </div>
          <Divider className="mt-4" />
          <CourseCard cohortId={cohort.id} cohortAllocationId={allocation.id} />
        </div>

        {/* <div className="lg:col-start-3">
          <Subheading>Tijdlijn</Subheading>
          <Divider className="mt-4" />
        </div> */}
      </div>
    </SWRConfig>
  );
}
