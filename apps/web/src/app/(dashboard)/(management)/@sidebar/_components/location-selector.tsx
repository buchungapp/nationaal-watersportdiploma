import { ChevronDownIcon, Cog8ToothIcon } from "@heroicons/react/16/solid";
import { notFound, useSelectedLayoutSegments } from "next/navigation";
import { listLocationsForPerson } from "~/lib/nwd";
import { Avatar } from "../../../_components/avatar";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "../../../_components/dropdown";
import { SidebarItem, SidebarLabel } from "../../../_components/sidebar";

export async function LocationSelector({
  currentLocationSlug,
}: {
  currentLocationSlug: string;
}) {
  const locations = await listLocationsForPerson();
  const segments = useSelectedLayoutSegments();

  const currentLocation = locations.find(
    (location) => location.handle === currentLocationSlug,
  );

  console.log("segment :>> ", segments);

  if (!currentLocation) {
    return notFound();
  }

  return (
    <Dropdown>
      <DropdownButton
        as={SidebarItem}
        className="lg:mb-2.5"
        title={currentLocation.name ?? undefined}
      >
        <Avatar
          className="size-6 flex-shrink-0"
          initials={(currentLocation.name ?? currentLocation.handle).slice(
            0,
            2,
          )}
        />
        <SidebarLabel> {currentLocation.name}</SidebarLabel>
        <ChevronDownIcon />
      </DropdownButton>

      <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
        <DropdownItem href={`/locatie/${currentLocationSlug}/instellingen`}>
          <Cog8ToothIcon />
          <DropdownLabel>Instellingen</DropdownLabel>
        </DropdownItem>
        <DropdownDivider />

        {locations
          .filter((location) => location.id !== currentLocation.id)
          .map((location) => (
            <DropdownItem
              key={location.id}
              href={`/locatie/${location.handle}/personen`}
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
