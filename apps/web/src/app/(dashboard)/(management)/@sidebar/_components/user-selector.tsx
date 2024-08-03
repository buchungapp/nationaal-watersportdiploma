import {
  ArrowRightStartOnRectangleIcon,
  ChevronUpIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
import { constants } from "@nawadi/lib";
import { Github } from "~/app/_components/socials";
import { getAuthUserOrRedirect } from "~/lib/nwd";
import { LogOutDropdownItem } from "../../../_components/auth";
import { Avatar } from "../../../_components/avatar";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "../../../_components/dropdown";
import { SidebarItem } from "../../../_components/sidebar";

export async function UserSelector() {
  const currentUser = await getAuthUserOrRedirect();

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
        <DropdownItem href="/account">
          <UserIcon />
          <DropdownLabel>Mijn account</DropdownLabel>
        </DropdownItem>
        <DropdownDivider />
        <DropdownItem href="/privacy" target="_blank">
          <ShieldCheckIcon />
          <DropdownLabel>Privacyverklaring</DropdownLabel>
        </DropdownItem>
        <DropdownItem href={constants.GITHUB_URL} target="_blank">
          <Github data-slot="icon" />
          <DropdownLabel>GitHub</DropdownLabel>
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
