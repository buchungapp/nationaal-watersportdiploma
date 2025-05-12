import {
  ArrowRightStartOnRectangleIcon,
  ChevronUpIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
import { constants } from "@nawadi/lib";
import { Suspense } from "react";
import { Github } from "~/app/_components/socials";
import { getUserOrThrow } from "~/lib/nwd";
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

async function UserSelectorContent() {
  const currentUser = await getUserOrThrow();

  return (
    <Dropdown>
      <DropdownButton as={SidebarItem}>
        <span className="flex items-center gap-3 min-w-0">
          <Avatar
            initials={(currentUser.displayName ?? currentUser.email).slice(
              0,
              2,
            )}
            className="size-6 shrink-0"
            square
            alt=""
          />
          <span className="min-w-0">
            <span className="block font-medium text-zinc-950 dark:text-white text-sm/5 truncate">
              {currentUser.displayName}
            </span>
            <span className="block font-normal text-zinc-500 dark:text-zinc-400 text-xs/5 truncate">
              {currentUser.email}
            </span>
          </span>
        </span>
        <ChevronUpIcon />
      </DropdownButton>
      <DropdownMenu className="z-50 min-w-(--button-width)">
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

function UserSelectorFallback() {
  return (
    <Dropdown>
      <DropdownButton as={SidebarItem} disabled>
        <span className="flex items-center gap-3 w-full">
          <Avatar initials={"..."} className="size-6 shrink-0" square alt="" />
          <span className="w-full">
            <span className="inline-block bg-gray-300 rounded w-2/3 h-4.5 align-middle animate-pulse" />
            <span className="inline-block bg-gray-300 rounded w-full h-3.5 align-middle animate-pulse" />
          </span>
        </span>
        <ChevronUpIcon />
      </DropdownButton>
    </Dropdown>
  );
}

export function UserSelector() {
  return (
    <Suspense fallback={<UserSelectorFallback />}>
      <UserSelectorContent />
    </Suspense>
  );
}
