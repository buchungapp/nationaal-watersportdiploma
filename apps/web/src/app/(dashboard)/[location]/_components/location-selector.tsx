import { ChevronUpDownIcon } from "@heroicons/react/16/solid";
import { notFound } from "next/navigation";
import { retrieveLocationByHandle } from "~/lib/nwd";
import { Avatar } from "../../_components/avatar";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  HeadlessMenuButton,
} from "../../_components/dropdown";

export async function LocationSelector({
  currentLocationSlug,
}: {
  currentLocationSlug: string;
}) {
  const currentLocation = await retrieveLocationByHandle(
    currentLocationSlug,
  ).catch(() => notFound());

  return (
    <Dropdown>
      <HeadlessMenuButton
        className="flex items-center w-full gap-3 rounded-xl border border-transparent py-1 data-[active]:border-zinc-200 data-[hover]:border-zinc-200 dark:data-[active]:border-zinc-700 dark:data-[hover]:border-zinc-700"
        aria-label="Account options"
      >
        <Avatar
          className="size-6"
          initials={(currentLocation.name ?? currentLocation.handle).slice(
            0,
            2,
          )}
        />
        <span className="block text-left">
          <span className="block text-sm/5 font-medium">
            {currentLocation.name}
          </span>
        </span>
        <ChevronUpDownIcon className="ml-auto mr-1 size-4 shrink-0 stroke-zinc-400" />
      </HeadlessMenuButton>
      <DropdownMenu className="min-w-[--button-width] z-50">
        <DropdownItem href={`/${currentLocationSlug}/instellingen`}>
          Instellingen
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
