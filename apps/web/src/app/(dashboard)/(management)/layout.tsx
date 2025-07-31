import {
  ArrowRightStartOnRectangleIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
import { constants } from "@nawadi/lib";
import type React from "react";
import { Github } from "~/app/_components/socials";
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
import { withSecretariaatAuthorization } from "./secretariaat/_components/unauthorized";

async function Layout({
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

export default withSecretariaatAuthorization(Layout, "notFound");
