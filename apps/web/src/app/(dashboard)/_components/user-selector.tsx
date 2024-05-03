import { MenuButton as HeadlessMenuButton } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/16/solid";
import { logout } from "~/app/_actions/auth";
import { retrieveUser } from "~/lib/nwd";
import { Avatar } from "./avatar";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSeparator,
} from "./dropdown";

export async function UserSelector() {
  const currentUser = await retrieveUser();

  return (
    <Dropdown>
      <HeadlessMenuButton
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
      </HeadlessMenuButton>
      <DropdownMenu className="min-w-[--button-width] z-50">
        <DropdownSeparator />
        <DropdownItem onClick={logout}>Uitloggen</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
