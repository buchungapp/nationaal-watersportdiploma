import { ChevronDownIcon, Cog8ToothIcon } from "@heroicons/react/16/solid";
import { notFound } from "next/navigation";
import { listLocationsForPerson, listRolesForLocation } from "~/lib/nwd";
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

export async function LocationSelector({
  currentLocationSlug,
}: {
  currentLocationSlug: string;
}) {
  const locations = await listLocationsForPerson();

  const currentLocation = locations.find(
    (location) => location.handle === currentLocationSlug,
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
          className="size-6 flex-shrink-0"
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
            <DropdownItem href={`/locatie/${currentLocationSlug}/instellingen`}>
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
                className="bg-purple-500 text-white "
              />
              <DropdownLabel>{location.name}</DropdownLabel>
            </DropdownItem>
          ))}
      </DropdownMenu>
    </Dropdown>
  );
}
