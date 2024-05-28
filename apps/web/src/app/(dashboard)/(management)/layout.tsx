import {
  ArrowRightStartOnRectangleIcon,
  Cog8ToothIcon,
  InboxIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
import React from "react";
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

export default function Layout({
  children,
  sidebar,
}: Readonly<{
  children: React.ReactNode;
  sidebar: React.ReactNode;
}>) {

  console.log('sidebar :>> ', sidebar)

  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            <NavbarItem href="/search" aria-label="Search">
              <MagnifyingGlassIcon />
            </NavbarItem>
            <NavbarItem href="/inbox" aria-label="Inbox">
              <InboxIcon />
            </NavbarItem>
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <Avatar src="/profile-photo.jpg" square />
              </DropdownButton>
              <DropdownMenu className="min-w-64" anchor="bottom end">
                <DropdownItem href="/my-profile">
                  <UserIcon />
                  <DropdownLabel>My profile</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/settings">
                  <Cog8ToothIcon />
                  <DropdownLabel>Settings</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/privacy-policy">
                  <ShieldCheckIcon />
                  <DropdownLabel>Privacy policy</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="/share-feedback">
                  <LightBulbIcon />
                  <DropdownLabel>Share feedback</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/logout">
                  <ArrowRightStartOnRectangleIcon />
                  <DropdownLabel>Sign out</DropdownLabel>
                </DropdownItem>
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
