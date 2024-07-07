import { PlusIcon } from "@heroicons/react/16/solid";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SWRConfig } from "swr";
import Search from "~/app/(dashboard)/(management)/_components/search";
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import {
  isInstructorInCohort,
  listCountries,
  listPersonsForLocationByRole,
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
import StudentsTable from "./_components/students-table";

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

export default async function Page({
  params,
}: {
  params: { location: string; cohort: string };
}) {
  const cohortPromise = retrieveLocationByHandle(params.location).then(
    (location) =>
      retrieveCohortByHandle(params.cohort, location.id).then((cohort) => {
        if (!cohort) {
          notFound();
        }
        return cohort;
      }),
  );

  const [cohort, students, location] = await Promise.all([
    cohortPromise,
    cohortPromise.then((cohort) =>
      listStudentsWithCurriculaByCohortId(cohort.id),
    ),
    retrieveLocationByHandle(params.location),
    ,
  ]);

  return (
    <SWRConfig
      value={{
        fallback: {
          // Note that there is no `await` here,
          // so it only blocks rendering of components that
          // actually rely on this data.
          countries: listCountries(),
          [`allStudents-${location.id}`]: listPersonsForLocationByRole(
            location.id,
            "student",
          ),
          isInstructor: isInstructorInCohort(cohort.id),
          allPrograms: listPrograms(),
        },
      }}
    >
      <DialogWrapper>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-sm:w-full sm:flex-1">
            <div className="mt-4 flex max-w-xl gap-4">
              <Search placeholder="Doorzoek cursisten..." />
              {/* <FilterSelect /> */}
            </div>
          </div>
          <Suspense fallback={null}>
            <QuickActionButtons locationId={location.id} cohortId={cohort.id} />
          </Suspense>
        </div>

        <StudentsTable
          students={students}
          totalItems={students.length}
          cohortId={cohort.id}
        />

        <Dialogs locationId={location.id} cohortId={cohort.id} />
      </DialogWrapper>
    </SWRConfig>
  );
}
