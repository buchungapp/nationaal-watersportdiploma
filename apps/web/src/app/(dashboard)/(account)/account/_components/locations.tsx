import { Suspense } from "react";
import { Avatar } from "~/app/(dashboard)/_components/avatar";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  GridList,
  GridListHeader,
  GridListItem,
} from "~/app/(dashboard)/_components/grid-list";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { listLocationsWherePrimaryPersonHasManagementRole } from "~/lib/nwd";

async function LocationsList() {
  const locations =
    await listLocationsWherePrimaryPersonHasManagementRole().catch(() => []);

  return locations.length > 0 ? (
    <GridList>
      {locations.map((location) => (
        <GridListItem key={location.id}>
          <GridListHeader href={`/locatie/${location.handle}/cohorten`}>
            <Avatar
              square
              initials={location.name?.slice(0, 2)}
              className="bg-zinc-900 size-8 text-white"
            />
            <div className="font-medium text-slate-900 text-sm leading-6">
              {location.name}
            </div>
          </GridListHeader>
        </GridListItem>
      ))}
    </GridList>
  ) : (
    <Text className="italic">
      Je bent nog niet gekoppeld aan een vaarlocatie. Neem contact op met de{" "}
      <TextLink href="/vaarlocaties" target="_blank">
        vaarlocatie
      </TextLink>{" "}
      waar je lesgeeft.
    </Text>
  );
}

function LocationsListFallback() {
  return (
    <GridList>
      <GridListItem>
        <GridListHeader href="#">
          <Avatar
            square
            initials={"..."}
            className="bg-zinc-900 size-8 text-white"
          />
          <div className="bg-gray-200 rounded w-32 h-6 animate-pulse" />
        </GridListHeader>
      </GridListItem>
    </GridList>
  );
}

export function Locations() {
  return (
    <div>
      <Subheading>Vaarlocaties waar jij lesgeeft</Subheading>
      <Divider className="mt-2 mb-4" />
      <Suspense fallback={<LocationsListFallback />}>
        <LocationsList />
      </Suspense>
    </div>
  );
}
