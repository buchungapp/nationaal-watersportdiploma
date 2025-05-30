import type { User } from "@nawadi/core";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "~/app/(dashboard)/_components/avatar";
import {
  GridList,
  GridListItem,
  gridContainer,
} from "~/app/(dashboard)/_components/grid-list-v2";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import {
  StackedLayoutCardDisclosure,
  StackedLayoutCardDisclosureChevron,
} from "~/app/(dashboard)/_components/stacked-layout";
import { Text } from "~/app/(dashboard)/_components/text";
import { listActiveCohortsForPerson, listLocationsForPerson } from "~/lib/nwd";

async function ActiveCohortsForLocation({
  location,
  activeCohortsPromise,
}: {
  location: {
    id: string;
    handle: string;
  };
  activeCohortsPromise: ReturnType<typeof listActiveCohortsForPerson>;
}) {
  const activeCohorts = (await activeCohortsPromise)
    .filter((cohort) => cohort.locationId === location.id)
    .flatMap((cohort) => cohort.cohorts);

  if (activeCohorts.length < 1) {
    return null;
  }

  return (
    <div className="mt-2">
      <Text className="text-zinc-600 font-medium">Lopende cohorten</Text>
      <ul className="flex flex-col flex-1">
        {activeCohorts.map((cohort) => (
          <li key={cohort.id}>
            <Link
              href={`/locatie/${location.handle}/cohorten/${cohort.handle}`}
              className="flex justify-between items-center gap-2 data-active:bg-zinc-50 data-hover:bg-zinc-50 py-1 text-zinc-500 dark:text-zinc-400 lg:text-sm text-base"
            >
              {cohort.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function LocationsContent({
  personPromise,
}: { personPromise: Promise<User.Person.$schema.Person> }) {
  const person = await personPromise;

  const activeCohortsPromise = listActiveCohortsForPerson({
    personId: person.id,
  });

  const locations = await listLocationsForPerson(person.id, [
    "instructor",
    "location_admin",
  ]);

  if (locations.length < 1) {
    return null;
  }

  return (
    <StackedLayoutCardDisclosure
      defaultOpen
      className={gridContainer}
      header={
        <>
          <div className="flex justify-between items-center gap-2">
            <Subheading>Jouw leslocaties</Subheading>
            <StackedLayoutCardDisclosureChevron />
          </div>
          <Text>
            De locaties waar je als instructeur en/of beheerder aan gekoppeld
            bent.
          </Text>
        </>
      }
    >
      <GridList className="mt-2">
        {locations.map((location) => (
          <GridListItem key={location.id} className="bg-white px-2">
            <Link
              href={`/locatie/${location.handle}/cohorten`}
              className="flex items-center gap-2"
            >
              <Avatar
                square
                className="mr-2.5 size-6 sm:size-5 sm:mr-2"
                initials={location.name?.slice(0, 2)}
                src={location.logoSquare?.transformUrl}
              />
              <Text className="font-semibold text-zinc-800">
                {location.name}
              </Text>
            </Link>
            <Suspense fallback={null}>
              <ActiveCohortsForLocation
                location={location}
                activeCohortsPromise={activeCohortsPromise}
              />
            </Suspense>
          </GridListItem>
        ))}
      </GridList>
    </StackedLayoutCardDisclosure>
  );
}

export async function Locations({
  personPromise,
}: { personPromise: Promise<User.Person.$schema.Person> }) {
  return (
    <Suspense fallback={null}>
      <LocationsContent personPromise={personPromise} />
    </Suspense>
  );
}
