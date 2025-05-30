import { ArrowRightIcon } from "@heroicons/react/16/solid";
import { Suspense } from "react";
import { Avatar } from "~/app/(dashboard)/_components/avatar";
import { TextButton } from "~/app/(dashboard)/_components/button";
import {
  GridList,
  GridListItem,
  gridContainer,
} from "~/app/(dashboard)/_components/grid-list-v2";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Link } from "~/app/(dashboard)/_components/link";
import {
  StackedLayoutCardDisclosure,
  StackedLayoutCardDisclosureChevron,
} from "~/app/(dashboard)/_components/stacked-layout";
import { Text } from "~/app/(dashboard)/_components/text";
import { listCohortForPerson } from "~/lib/nwd";

async function LocationsContent() {
  const locations = await listCohortForPerson({
    respectCohortVisibility: ["open", "upcoming"],
  });

  if (locations.length === 0) {
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
      <GridList>
        {locations.map(({ location, cohorts }) => (
          <GridListItem key={location.id} className="bg-white">
            <TextButton
              color="dark/zinc"
              href={`/locatie/${location.handle}/cohorten`}
              center={false}
              className="justify-between w-full px-4"
            >
              <div className="flex items-center gap-2">
                <Avatar
                  square
                  className="mr-2.5 size-6 sm:size-5 sm:mr-2"
                  initials={location.name?.slice(0, 2)}
                />
                {location.name}
              </div>
              <div>
                <ArrowRightIcon className="size-4" />
              </div>
            </TextButton>
            {cohorts.length > 0 ? (
              <ul className="flex flex-col flex-1 px-2 mt-2">
                {cohorts.map((cohort) => (
                  <li key={cohort.id}>
                    <Link
                      href={`/locatie/${location.handle}/cohorten/${cohort.id}`}
                      className="flex justify-between items-center gap-2 data-active:bg-zinc-50 data-hover:bg-zinc-50 px-2 py-1 text-zinc-500 dark:text-zinc-400 lg:text-sm text-base"
                    >
                      {cohort.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </GridListItem>
        ))}
      </GridList>
    </StackedLayoutCardDisclosure>
  );
}

export async function Locations() {
  return (
    <Suspense
      fallback={
        <div className="bg-gray-200 rounded-md w-full h-40 animate-pulse" />
      }
    >
      <LocationsContent />
    </Suspense>
  );
}
