import { MenuButton } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/16/solid";
import { logout } from "~/app/_actions/auth";
import { getUserOrThrow } from "~/lib/nwd";
import { Avatar } from "../../_components/avatar";
import {
  Dropdown,
  DropdownDivider,
  DropdownItem,
  DropdownMenu,
} from "../../_components/dropdown";

export async function UserSelector() {
  const currentUser = await getUserOrThrow();

  return (
    <Dropdown>
      <MenuButton
        className="flex items-center w-full gap-3 rounded-xl border border-transparent py-1 data-[active]:border-zinc-200 data-[hover]:border-zinc-200 dark:data-[active]:border-zinc-700 dark:data-[hover]:border-zinc-700"
        aria-label="Account options"
      >
        <Avatar
          className="size-8"
          initials={(currentUser.displayName ?? currentUser.email).slice(0, 2)}
          square={true}
        />
        <span className="block text-left">
          <span className="block text-sm/5 font-medium">
            {currentUser.displayName}
          </span>
          <span className="block text-xs/5 text-zinc-500">
            {currentUser.email}
          </span>
        </span>
        <ChevronUpDownIcon className="ml-auto mr-1 size-4 shrink-0 stroke-zinc-400" />
      </MenuButton>
      <DropdownMenu className="min-w-[--button-width] z-50">
        <DropdownDivider />
        <DropdownItem href="/profiel">Profiel</DropdownItem>
        <DropdownItem onClick={logout}>Uitloggen</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
