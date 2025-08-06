import { ChevronDownIcon, Cog8ToothIcon } from "@heroicons/react/16/solid";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { listActiveLocationsForPerson, listRolesForLocation } from "~/lib/nwd";
import { Avatar } from "../../../../../_components/avatar";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "../../../../../_components/dropdown";
import { SidebarItem, SidebarLabel } from "../../../../../_components/sidebar";

async function LocationSelectorContent(props: {
  params: Promise<{
    location: string;
  }>;
}) {
  const [params, locations] = await Promise.all([
    props.params,
    listActiveLocationsForPerson(),
  ]);

  const currentLocation = locations.find(
    (location) => location.handle === params.location,
  );

  if (!currentLocation) {
    return notFound();
  }

  const rolesInCurrentLocation = await listRolesForLocation(currentLocation.id);

  const isLocationAdmin = rolesInCurrentLocation.includes("location_admin");
  const disabled = !isLocationAdmin && locations.length <= 1;

  return (
    <Dropdown>
      <DropdownButton
        as={SidebarItem}
        className="lg:mb-2.5"
        title={currentLocation.name ?? undefined}
        disabled={disabled}
      >
        <Avatar
          className="size-6 shrink-0"
          initials={(currentLocation.name ?? currentLocation.handle).slice(
            0,
            2,
          )}
        />
        <SidebarLabel> {currentLocation.name}</SidebarLabel>
        {disabled ? null : <ChevronDownIcon />}
      </DropdownButton>

      <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
        {isLocationAdmin ? (
          <>
            <DropdownItem href={`/locatie/${params.location}/instellingen`}>
              <Cog8ToothIcon />
              <DropdownLabel>Instellingen</DropdownLabel>
            </DropdownItem>

            {locations.length > 1 ? <DropdownDivider /> : null}
          </>
        ) : null}

        {locations
          .filter((location) => location.id !== currentLocation.id)
          .map((location) => (
            <DropdownItem
              key={location.id}
              href={`/locatie/${location.handle}/cohorten`}
            >
              <Avatar
                slot="icon"
                initials={(location.name ?? location.handle).slice(0, 2)}
                className="bg-purple-500 text-white"
              />
              <DropdownLabel>{location.name}</DropdownLabel>
            </DropdownItem>
          ))}
      </DropdownMenu>
    </Dropdown>
  );
}

function LocationSelectorFallback() {
  return (
    <Dropdown>
      <DropdownButton
        as={SidebarItem}
        className="lg:mb-2.5"
        title={undefined}
        disabled={true}
      >
        <Avatar className="size-6 shrink-0" initials={"..."} />
        <SidebarLabel className="w-full">
          <span className="inline-block bg-gray-300 rounded w-full h-4.5 align-middle animate-pulse" />
        </SidebarLabel>
        <ChevronDownIcon />
      </DropdownButton>
    </Dropdown>
  );
}

export function LocationSelector(props: {
  params: Promise<{
    location: string;
  }>;
}) {
  return (
    <Suspense fallback={<LocationSelectorFallback />}>
      <LocationSelectorContent params={props.params} />
    </Suspense>
  );
}
