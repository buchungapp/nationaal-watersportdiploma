import {
  ArrowRightStartOnRectangleIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
import { constants } from "@nawadi/lib";
import { connection } from "next/server";
import type React from "react";
import { Github } from "~/app/_components/socials";
import { getUserOrThrow } from "~/lib/nwd";
import { LogOutDropdownItem } from "../_components/auth";
import { Avatar } from "../_components/avatar";
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

export default async function Layout({
  children,
  sidebar,
}: Readonly<{
  children: React.ReactNode;
  sidebar: React.ReactNode;
}>) {
  await connection();
  const user = await getUserOrThrow();

  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <Avatar
                  initials={(user.displayName ?? user.email).slice(0, 2)}
                  square
                />
              </DropdownButton>
              <DropdownMenu className="min-w-64" anchor="bottom end">
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
          </NavbarSection>
        </Navbar>
      }
      sidebar={sidebar}
    >
      {children}
    </SidebarLayout>
  );
}
