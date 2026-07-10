import {
  ArrowRightStartOnRectangleIcon,
  Cog6ToothIcon,
  HomeIcon,
  ShieldCheckIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/16/solid";
import { constants } from "@nawadi/lib";
import type React from "react";
import { Github } from "~/app/_components/socials";
import { isSystemAdmin } from "~/lib/authorization";
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

async function UserDropdownMenu() {
  const { email } = await getUserOrThrow();
  const showSecretariaat = isSystemAdmin(email);

  return (
    <DropdownMenu className="min-w-64" anchor="bottom end">
      <DropdownItem href="/account">
        <UsersIcon />
        <DropdownLabel>Mijn account</DropdownLabel>
      </DropdownItem>
      <DropdownItem href="/profiel">
        <UserIcon />
        <DropdownLabel>Mijn profiel</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem href="/">
        <HomeIcon />
        <DropdownLabel>Website</DropdownLabel>
      </DropdownItem>
      {showSecretariaat && (
        <DropdownItem href="/secretariaat">
          <Cog6ToothIcon />
          <DropdownLabel>Secretariaat</DropdownLabel>
        </DropdownItem>
      )}
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
  );
}

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
              <UserDropdownMenu />
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
