import {
  ArrowRightStartOnRectangleIcon,
  ShieldCheckIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/16/solid";
import { constants } from "@nawadi/lib";
import type React from "react";
import { Suspense } from "react";
import { Github } from "~/app/_components/socials";
import { getUserOrThrow } from "~/lib/nwd";
import { LogOutDropdownItem } from "../_components/auth";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "../_components/dropdown";
import {
  Navbar,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from "../_components/navbar";
import { SidebarLayout } from "../_components/sidebar-layout";
import { UserAvatar } from "../_components/user-avatar";

export default function Layout({
  children,
  sidebar,
}: Readonly<{
  children: React.ReactNode;
  sidebar: React.ReactNode;
}>) {
  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <UserAvatar />
              </DropdownButton>
              <DropdownMenu className="min-w-64" anchor="bottom end">
                <DropdownItem href="/account">
                  <UsersIcon />
                  <DropdownLabel>Mijn account</DropdownLabel>
                </DropdownItem>
                <Suspense>
                  <ProfileDropdownItem />
                </Suspense>
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
          </NavbarSection>
        </Navbar>
      }
      sidebar={sidebar}
    >
      {children}
    </SidebarLayout>
  );
}

async function ProfileDropdownItem() {
  const currentUser = await getUserOrThrow();
  const primaryPerson = currentUser?.persons.find((person) => person.isPrimary);

  if (!primaryPerson) {
    return null;
  }

  return (
    <DropdownItem href={`/profiel/${primaryPerson.handle}`}>
      <UserIcon />
      <DropdownLabel>Mijn profiel</DropdownLabel>
    </DropdownItem>
  );
}
