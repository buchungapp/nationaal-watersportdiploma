import {
  ArrowRightStartOnRectangleIcon,
  ChevronUpIcon,
  Cog8ToothIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
import { getUserOrThrow } from "~/lib/nwd";
import { LogOutDropdownItem } from "../../_components/auth";
import { Avatar } from "../../_components/avatar";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "../../_components/dropdown";
import { SidebarItem } from "../../_components/sidebar";

export async function UserSelector() {
  const currentUser = await getUserOrThrow();

  return (
    <Dropdown>
      <DropdownButton as={SidebarItem}>
        <span className="flex min-w-0 items-center gap-3">
          <Avatar
            initials={(currentUser.displayName ?? currentUser.email).slice(
              0,
              2,
            )}
            className="size-10"
            square
            alt=""
          />
          <span className="min-w-0">
            <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
              {currentUser.displayName}
            </span>
            <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
              {currentUser.email}
            </span>
          </span>
        </span>
        <ChevronUpIcon />
      </DropdownButton>
      <DropdownMenu className="min-w-[--button-width] z-50">
        <DropdownItem href="/my-profile">
          <UserIcon />
          <DropdownLabel>Mijn paspoort</DropdownLabel>
        </DropdownItem>
        <DropdownItem href="/settings">
          <Cog8ToothIcon />
          <DropdownLabel>Instellingen</DropdownLabel>
        </DropdownItem>
        <DropdownDivider />
        <DropdownItem href="/privacy-policy">
          <ShieldCheckIcon />
          <DropdownLabel>Privacybeleid</DropdownLabel>
        </DropdownItem>
        <DropdownDivider />
        <LogOutDropdownItem>
          <ArrowRightStartOnRectangleIcon />
          <DropdownLabel>Uitloggen</DropdownLabel>
        </LogOutDropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
