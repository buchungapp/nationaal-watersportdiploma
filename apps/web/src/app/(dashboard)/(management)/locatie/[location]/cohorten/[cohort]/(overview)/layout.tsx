import {
  ArrowRightIcon,
  CalendarIcon,
  ChevronLeftIcon,
} from "@heroicons/react/16/solid";
import dayjs from "dayjs";
import "dayjs/locale/nl";
import { notFound } from "next/navigation";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Link } from "~/app/(dashboard)/_components/link";
import {
  listPrivilegesForCohort,
  listRolesForLocation,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { LayoutTabs } from "./_components/layout-tabs";
import { CohortActions } from "./_components/quick-actions";

dayjs.locale("nl");

export default async function Layout({
  params,
  children,
}: {
  params: { location: string; cohort: string };
  children: React.ReactNode;
}) {
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
    <>
      <div className="max-lg:hidden">
        <Link
          href={`/locatie/${params.location}/cohorten`}
          className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
          Cohorten
        </Link>
      </div>
      <div className="mt-4">
        <div className="flex items-center gap-4">
          <Heading>{`Cohort ${cohort.label}`}</Heading>
        </div>

        <div className="isolate mt-1 flex flex-wrap justify-between gap-x-6">
          <div className="flex flex-wrap gap-x-10 gap-y-2 py-1.5 items-center gap-3 text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white">
            <CalendarIcon className="size-4 shrink-0 fill-zinc-400 dark:fill-zinc-500" />
            <span>
              {dayjs(cohort.accessStartTime).format("ddd DD-MM-YYYY HH:mm uur")}
            </span>
            <ArrowRightIcon className="size-4 shrink-0 fill-zinc-400 dark:fill-zinc-500" />
            <span>
              {dayjs(cohort.accessEndTime).format("ddd DD-MM-YYYY HH:mm uur")}
            </span>
          </div>
          <div className="flex gap-4">
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

      <div className="mt-4">{children}</div>
    </>
  );
}
