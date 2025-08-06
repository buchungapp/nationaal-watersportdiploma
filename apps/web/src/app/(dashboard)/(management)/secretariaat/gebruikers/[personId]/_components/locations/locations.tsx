import type { User } from "@nawadi/core";
import { Suspense } from "react";
import { ScrollableGridList } from "~/app/(dashboard)/(account)/profiel/[handle]/_components/scrollable-grid-list";
import PersonRoleBadge from "~/app/(dashboard)/(management)/_components/person-role-badge";
import { Avatar } from "~/app/(dashboard)/_components/avatar";
import { Badge } from "~/app/(dashboard)/_components/badge";
import {
  GridListItem,
  gridContainer,
} from "~/app/(dashboard)/_components/grid-list-v2";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Link } from "~/app/(dashboard)/_components/link";
import { StackedLayoutCardDisclosureChevron } from "~/app/(dashboard)/_components/stacked-layout";
import { StackedLayoutCardDisclosure } from "~/app/(dashboard)/_components/stacked-layout";
import { Text } from "~/app/(dashboard)/_components/text";
import { listAllLocationsForPerson } from "~/lib/nwd";

function LocationsListSkeleton() {
  return (
    <>
      {[1, 2].map((i) => (
        <GridListItem key={i} className="bg-white px-2 lg:px-4">
          <div className="flex items-center gap-2.5 lg:gap-4">
            <div className="bg-zinc-200 rounded size-6 lg:size-10 animate-pulse" />
            <div className="bg-zinc-200 rounded w-32 lg:w-48 h-4 lg:h-5 animate-pulse" />
          </div>
          <div className="mt-2 lg:mt-3 pl-8.5 lg:pl-14">
            <div className="bg-zinc-100 mb-1 lg:mb-2 rounded w-24 h-3 animate-pulse" />
            <div className="space-y-1">
              <div className="bg-zinc-100 rounded w-40 h-3 animate-pulse" />
              <div className="bg-zinc-100 rounded w-36 h-3 animate-pulse" />
            </div>
          </div>
        </GridListItem>
      ))}
    </>
  );
}

async function LocationsList({
  personPromise,
}: { personPromise: Promise<User.Person.$schema.Person> }) {
  const person = await personPromise;

  const locations = await listAllLocationsForPerson(person.id).catch(() => []);

  if (locations.length < 1) {
    return null;
  }

  return (
    <>
      {locations.map((location) => (
        <GridListItem
          key={location.id}
          className="flex flex-col bg-white px-2 lg:border-zinc-200/80 duration-200"
        >
          <Link
            href={`/locatie/${location.handle}/cohorten`}
            className="group flex items-center gap-2.5"
          >
            <Avatar
              square
              className="group-hover:ring-2 group-hover:ring-branding-light/30 size-6 lg:size-10 transition-all duration-200 shrink-0"
              initials={location.name?.slice(0, 2)}
              src={location.logoSquare?.transformUrl}
            />
            <Text className="font-semibold text-zinc-800 group-hover:text-branding-dark transition-colors">
              {location.name}
            </Text>
            <Badge color={location.linkStatus === "linked" ? "green" : "red"}>
              {location.linkStatus === "linked"
                ? "Actief"
                : location.linkStatus === "revoked"
                  ? "Ingetrokken"
                  : "Verwijderd"}
            </Badge>
          </Link>
          <p className="mt-2 font-semibold text-xs">Rollen</p>
          <div className="flex items-center gap-1">
            {location.roles.map((role) => (
              <PersonRoleBadge key={role} role={role} />
            ))}
          </div>
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
            <Subheading>Locaties</Subheading>
            <StackedLayoutCardDisclosureChevron />
          </div>
          <Text>De locaties waar deze gebruiker aan gekoppeld is.</Text>
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
