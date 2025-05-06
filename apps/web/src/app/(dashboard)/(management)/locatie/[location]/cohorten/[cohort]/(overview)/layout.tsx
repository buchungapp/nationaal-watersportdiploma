import {
  ArrowRightIcon,
  CalendarIcon,
  ChevronLeftIcon,
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
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Link } from "~/app/(dashboard)/_components/link";
import dayjs from "~/lib/dayjs";
import {
  isInstructorInCohort,
  listCountries,
  listDistinctTagsForCohort,
  listInstructorsByCohortId,
  listPersonsForLocationByRole,
  listPrivilegesForCohort,
  listPrograms,
  listRolesForLocation,
  listStudentsWithCurriculaByCohortId,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import {
  DialogButtons,
  DialogWrapper,
  Dialogs,
} from "./_components/dialog-context";
import { LayoutTabs } from "./_components/layout-tabs";
import { CohortActions } from "./_components/quick-actions";

// We need this for the bulk actions
export const maxDuration = 240;

async function StudentCount({ cohortId }: { cohortId: string }) {
  const count = (await listStudentsWithCurriculaByCohortId(cohortId)).length;

  return count;
}

async function QuickActionButtons({
  locationId,
}: {
  cohortId: string;
  locationId: string;
}) {
  const [roles] = await Promise.all([listRolesForLocation(locationId)]);

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

export default async function Layout(props: {
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

  const [roles, privileges] = await Promise.all([
    listRolesForLocation(location.id),
    listPrivilegesForCohort(cohort.id),
  ]);

  return (
    <SWRConfig
      value={{
        fallback: {
          // Note that there is no `await` here,
          // so it only blocks rendering of components that
          // actually rely on this data.
          countries: listCountries(),
          [unstable_serialize(["allStudents", location.id])]:
            listPersonsForLocationByRole(location.id, "student"),
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
          allPrograms: listPrograms(),
        },
      }}
    >
      <DialogWrapper>
        <div className="max-lg:hidden">
          <Link
            href={`/locatie/${params.location}/cohorten`}
            className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm/6"
          >
            <ChevronLeftIcon className="fill-zinc-400 dark:fill-zinc-500 size-4" />
            Cohorten
          </Link>
        </div>
        <div className="mt-4">
          <div className="flex items-center gap-4">
            <Heading>{`Cohort ${cohort.label}`}</Heading>
          </div>

          <div className="isolate flex flex-wrap justify-between gap-x-6 mt-1">
            <div className="flex flex-wrap gap-x-10 gap-y-4 py-1.5">
              <span className="flex items-center gap-3 text-zinc-950 dark:text-white sm:text-sm/6 text-base/6">
                <UsersIcon className="fill-zinc-400 dark:fill-zinc-500 size-4 shrink-0" />
                <span>
                  <Suspense fallback={null}>
                    <StudentCount cohortId={cohort.id} />
                  </Suspense>
                </span>
              </span>

              <span className="flex items-center gap-3 text-zinc-950 dark:text-white sm:text-sm/6 text-base/6">
                <CalendarIcon className="fill-zinc-400 dark:fill-zinc-500 size-4 shrink-0" />
                <div className="flex items-center gap-2">
                  <span>
                    {dayjs(cohort.accessStartTime)
                      .tz()
                      .format("ddd DD-MM-YYYY HH:mm uur")}
                  </span>
                  <ArrowRightIcon className="fill-zinc-400 dark:fill-zinc-500 size-4 shrink-0" />
                  <span>
                    {dayjs(cohort.accessEndTime)
                      .tz()
                      .format("ddd DD-MM-YYYY HH:mm uur")}
                  </span>
                </div>
              </span>
            </div>
            <div className="flex gap-4">
              <Suspense fallback={null}>
                <QuickActionButtons
                  locationId={location.id}
                  cohortId={cohort.id}
                />
              </Suspense>
              {roles.includes("location_admin") ? (
                <CohortActions
                  cohort={{
                    id: cohort.id,
                    label: cohort.label,
                    accessStartTime: cohort.accessStartTime,
                    accessEndTime: cohort.accessEndTime,
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>

        <Divider className="my-4" />

        <LayoutTabs personRoles={roles} personPrivileges={privileges} />

        <div className="mt-4 max-sm:mb-30">{children}</div>

        <Dialogs locationId={location.id} cohortId={cohort.id} />
      </DialogWrapper>
    </SWRConfig>
  );
}
