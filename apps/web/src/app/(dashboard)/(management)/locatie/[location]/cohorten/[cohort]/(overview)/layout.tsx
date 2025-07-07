import {
  ArrowRightIcon,
  CalendarIcon,
  PlusIcon,
  UsersIcon,
} from "@heroicons/react/16/solid";
import "dayjs/locale/nl";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SWRConfig, unstable_serialize } from "swr";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import dayjs from "~/lib/dayjs";
import {
  isInstructorInCohort,
  listCountries,
  listDistinctTagsForCohort,
  listInstructorsByCohortId,
  listPersonsForLocationWithPagination,
  listPrivilegesForCohort,
  listProgramsForLocation,
  listRolesForLocation,
  listStudentsWithCurriculaByCohortId,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import {
  BackToCohortsLink,
  BackToCohortsLinkFallback,
} from "./_components/back-to-cohorts-link";
import { Dialogs } from "./_components/dialog-context";
import {
  DialogButtons,
  DialogWrapper,
} from "./_components/dialog-context-client";
import { Heading, HeadingFallback } from "./_components/heading";
import { LayoutTabs, LayoutTabsFallback } from "./_components/layout-tabs";
import { CohortActions } from "./_components/quick-actions";

// We need this for the bulk actions
export const maxDuration = 240;

async function StudentCount(props: {
  params: Promise<{ location: string; cohort: string }>;
}) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);
  const cohort = await retrieveCohortByHandle(params.cohort, location.id);

  if (!cohort) {
    notFound();
  }

  const count = (await listStudentsWithCurriculaByCohortId(cohort.id)).length;

  return count;
}

function StudentCountFallback() {
  return (
    <span className="inline-block bg-gray-200 rounded w-4 h-4 align-middle animate-pulse" />
  );
}

async function QuickActionButtons(props: {
  params: Promise<{ location: string }>;
}) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);

  const [roles] = await Promise.all([listRolesForLocation(location.id)]);

  if (!roles.includes("location_admin")) {
    return null;
  }

  return (
    <Dropdown>
      <DropdownButton color="branding-orange">
        <PlusIcon />
        Cursist toevoegen
      </DropdownButton>
      <DropdownMenu>
        <DialogButtons />
      </DropdownMenu>
    </Dropdown>
  );
}

async function CohortDates(props: {
  params: Promise<{ location: string; cohort: string }>;
}) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);
  const cohort = await retrieveCohortByHandle(params.cohort, location.id);

  if (!cohort) {
    notFound();
  }

  return (
    <div className="flex items-center gap-2">
      <span>
        {dayjs(cohort.accessStartTime).tz().format("ddd DD-MM-YYYY HH:mm uur")}
      </span>
      <ArrowRightIcon className="fill-zinc-400 dark:fill-zinc-500 size-4 shrink-0" />
      <span>
        {dayjs(cohort.accessEndTime).tz().format("ddd DD-MM-YYYY HH:mm uur")}
      </span>
    </div>
  );
}

function CohortDatesFallback() {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block bg-gray-200 rounded w-41.75 h-4 animate-pulse" />
      <ArrowRightIcon className="fill-zinc-400 dark:fill-zinc-500 size-4 shrink-0" />
      <span className="inline-block bg-gray-200 rounded w-41.75 h-4 animate-pulse" />
    </div>
  );
}

async function LayoutContent(props: {
  params: Promise<{ location: string; cohort: string }>;
  children: React.ReactNode;
}) {
  const params = await props.params;
  const { children } = props;

  const location = await retrieveLocationByHandle(params.location);
  const cohort = await retrieveCohortByHandle(params.cohort, location.id);

  if (!cohort) {
    notFound();
  }

  return (
    <SWRConfig
      value={{
        fallback: {
          countries: listCountries(),
          [unstable_serialize([
            "allPersons",
            location.id,
            "?actorType=student",
          ])]: listPersonsForLocationWithPagination(location.id, {
            filter: {
              actorType: "student",
            },
            limit: 25,
          }),
          [unstable_serialize(["allInstructorsInCohort", cohort.id])]:
            listInstructorsByCohortId(cohort.id),
          [unstable_serialize(["isInstructorInCohort", cohort.id])]:
            isInstructorInCohort(cohort.id),
          [unstable_serialize(["permissionsInCohort", cohort.id])]:
            listPrivilegesForCohort(cohort.id),
          [unstable_serialize(["locationRoles", location.id])]:
            listRolesForLocation(location.id),
          [unstable_serialize(["distinctTagsForCohort", cohort.id])]:
            listDistinctTagsForCohort(cohort.id),
          [unstable_serialize(["allPrograms", location.id])]:
            listProgramsForLocation(location.id),
        },
      }}
    >
      <DialogWrapper>
        <div className="max-lg:hidden">
          <BackToCohortsLink params={props.params} />
        </div>
        <div className="mt-4">
          <div className="flex items-center gap-4">
            <Heading params={props.params} />
          </div>

          <div className="isolate flex flex-wrap justify-between gap-x-6 mt-1">
            <div className="flex flex-wrap gap-x-10 gap-y-4 py-1.5">
              <span className="flex items-center gap-3 text-zinc-950 dark:text-white sm:text-sm/6 text-base/6">
                <UsersIcon className="fill-zinc-400 dark:fill-zinc-500 size-4 shrink-0" />
                <span className="min-w-4">
                  <Suspense fallback={<StudentCountFallback />}>
                    <StudentCount params={props.params} />
                  </Suspense>
                </span>
              </span>

              <span className="flex items-center gap-3 text-zinc-950 dark:text-white sm:text-sm/6 text-base/6">
                <CalendarIcon className="fill-zinc-400 dark:fill-zinc-500 size-4 shrink-0" />
                <Suspense fallback={<CohortDatesFallback />}>
                  <CohortDates params={props.params} />
                </Suspense>
              </span>
            </div>
            <div className="flex gap-4">
              <Suspense fallback={null}>
                <QuickActionButtons params={props.params} />
              </Suspense>
              <CohortActions params={props.params} />
            </div>
          </div>
        </div>

        <Divider className="my-4" />

        <LayoutTabs params={props.params} />

        <div className="mt-4 max-sm:mb-30">{children}</div>

        <Dialogs params={props.params} />
      </DialogWrapper>
    </SWRConfig>
  );
}

export default function Layout(props: {
  params: Promise<{ location: string; cohort: string }>;
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <>
          <div className="max-lg:hidden">
            <BackToCohortsLinkFallback />
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-4">
              <HeadingFallback />
            </div>

            <div className="isolate flex flex-wrap justify-between gap-x-6 mt-1">
              <div className="flex flex-wrap gap-x-10 gap-y-4 py-1.5">
                <span className="flex items-center gap-3 text-zinc-950 dark:text-white sm:text-sm/6 text-base/6">
                  <UsersIcon className="fill-zinc-400 dark:fill-zinc-500 size-4 shrink-0" />
                  <span className="min-w-4">
                    <StudentCountFallback />
                  </span>
                </span>

                <span className="flex items-center gap-3 text-zinc-950 dark:text-white sm:text-sm/6 text-base/6">
                  <CalendarIcon className="fill-zinc-400 dark:fill-zinc-500 size-4 shrink-0" />
                  <CohortDatesFallback />
                </span>
              </div>
            </div>
          </div>

          <Divider className="my-4" />

          <LayoutTabsFallback />

          <div className="mt-4 max-sm:mb-30">
            <div className="bg-gray-200 rounded w-full h-96 animate-pulse" />
          </div>
        </>
      }
    >
      <LayoutContent {...props} />
    </Suspense>
  );
}
