import {
  ArrowRightStartOnRectangleIcon,
  LifebuoyIcon,
  ShieldCheckIcon,
} from "@heroicons/react/16/solid";
import Logo from "~/app/_components/brand/logo";
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
  NavbarDivider,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from "../_components/navbar";
import { Sidebar, SidebarBody, SidebarHeader } from "../_components/sidebar";
import { StackedLayout } from "../_components/stacked-layout";
import FeedbackDialog, {
  FeedbackButton,
  FeedbackProvider,
} from "./_components/feedback";

function PersonDropdownMenu() {
  return (
    <Dropdown>
      <DropdownButton as={NavbarItem}>
        <Avatar src="" initials="mm" square />
      </DropdownButton>
      <DropdownMenu className="min-w-64" anchor="bottom end">
        {/* <DropdownItem href="/instellingen">
         <Cog8ToothIcon />
         <DropdownLabel>Instellingen</DropdownLabel>
       </DropdownItem>
       <DropdownDivider /> */}
        <DropdownItem href="/help">
          <LifebuoyIcon />
          <DropdownLabel>Helpcentrum</DropdownLabel>
        </DropdownItem>
        <FeedbackButton />
        <DropdownItem href="/privacy">
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

export default function Layout({
  children,
  selector,
}: Readonly<{
  children: React.ReactNode;
  selector: React.ReactNode;
}>) {
  return (
    <StackedLayout
      navbar={
        <Navbar>
          <Logo />
          <NavbarDivider className="max-lg:hidden" />
          {selector}
          <NavbarDivider className="max-lg:hidden" />
          {/* <NavbarSection className="max-lg:hidden">
            {navItems.map(({ label, url }) => (
              <NavbarItem key={label} href={url}>
                {label}
              </NavbarItem>
            ))}
          </NavbarSection>
          */}
          <NavbarSpacer />
          <NavbarSection>
            <FeedbackProvider>
              <Dropdown>
                <DropdownButton as={NavbarItem}>
                  <Avatar src="" initials="mm" square />
                </DropdownButton>
                <DropdownMenu className="min-w-64" anchor="bottom end">
                  {/* <DropdownItem href="/instellingen">
                    <Cog8ToothIcon />
                    <DropdownLabel>Instellingen</DropdownLabel>
                  </DropdownItem>
                  <DropdownDivider /> */}
                  <DropdownItem href="/help">
                    <LifebuoyIcon />
                    <DropdownLabel>Helpcentrum</DropdownLabel>
                  </DropdownItem>
                  <FeedbackButton />
                  <DropdownItem href="/privacy">
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
              <FeedbackDialog />
            </FeedbackProvider>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>{selector}</SidebarHeader>
          <SidebarBody>
            {/* <SidebarSection>
              {navItems.map(({ label, url }) => (
                <SidebarItem key={label} href={url}>
                  {label}
                </SidebarItem>
              ))}
            </SidebarSection> */}
          </SidebarBody>
        </Sidebar>
      }
    >
      {children}
    </StackedLayout>
  );
}
