import type { User } from "@nawadi/core";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "~/app/(dashboard)/_components/avatar";
import {
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
import { ScrollableGridList } from "./scrollable-grid-list";

function LocationsListSkeleton() {
  return (
    <>
      {[1, 2].map((i) => (
        <GridListItem key={i} className="bg-white px-2 lg:px-4">
          <div className="flex items-center gap-2.5 lg:gap-4">
            <div className="size-6 lg:size-10 bg-zinc-200 rounded animate-pulse" />
            <div className="h-4 lg:h-5 bg-zinc-200 rounded animate-pulse w-32 lg:w-48" />
          </div>
          <div className="mt-2 pl-8.5 lg:mt-3 lg:pl-14">
            <div className="h-3 bg-zinc-100 rounded animate-pulse w-24 mb-1 lg:mb-2" />
            <div className="space-y-1">
              <div className="h-3 bg-zinc-100 rounded animate-pulse w-40" />
              <div className="h-3 bg-zinc-100 rounded animate-pulse w-36" />
            </div>
          </div>
        </GridListItem>
      ))}
    </>
  );
}

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
    <div className="mt-2 pl-8.5 lg:pl-14">
      <Text className="text-zinc-600 font-medium">Lopende cohorten</Text>
      <ul className="flex flex-col flex-1 mt-1">
        {activeCohorts.map((cohort) => (
          <li key={cohort.id}>
            <Link
              href={`/locatie/${location.handle}/cohorten/${cohort.handle}`}
              className="flex justify-between items-center gap-2 data-active:bg-zinc-50 data-hover:bg-zinc-50 py-1 text-zinc-500 dark:text-zinc-400 text-base lg:text-sm hover:text-zinc-700 transition-colors rounded-md px-2 -mx-2"
            >
              {cohort.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function LocationsList({
  personPromise,
}: { personPromise: Promise<User.Person.$schema.Person> }) {
  const person = await personPromise;

  const activeCohortsPromise = listActiveCohortsForPerson({
    personId: person.id,
  }).catch(() => []);

  const locations = await listLocationsForPerson(person.id, [
    "instructor",
    "location_admin",
  ]).catch(() => []);

  if (locations.length < 1) {
    return null;
  }

  return (
    <>
      {locations.map((location) => (
        <GridListItem
          key={location.id}
          className="bg-white px-2 lg:px-4 duration-200 lg:border-zinc-200/80 flex flex-col"
        >
          <Link
            href={`/locatie/${location.handle}/cohorten`}
            className="flex items-center gap-2.5 lg:gap-4 group"
          >
            <Avatar
              square
              className="size-6 lg:size-10 group-hover:ring-2 group-hover:ring-branding-light/30 transition-all duration-200"
              initials={location.name?.slice(0, 2)}
              src={location.logoSquare?.transformUrl}
            />
            <Text className="font-semibold text-zinc-800 group-hover:text-branding-dark transition-colors">
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
    </>
  );
}

export async function Locations({
  personPromise,
}: { personPromise: Promise<User.Person.$schema.Person> }) {
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
      <ScrollableGridList className="mt-2 max-h-[300px] lg:max-h-[400px] overflow-y-auto">
        <Suspense fallback={<LocationsListSkeleton />}>
          <LocationsList personPromise={personPromise} />
        </Suspense>
      </ScrollableGridList>
    </StackedLayoutCardDisclosure>
  );
}
