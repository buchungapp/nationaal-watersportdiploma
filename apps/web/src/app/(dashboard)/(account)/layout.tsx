import {
  ArrowRightStartOnRectangleIcon,
  LifebuoyIcon,
  ShieldCheckIcon,
} from "@heroicons/react/16/solid";
import Logo from "~/app/_components/brand/logo";
import { LogOutDropdownItem } from "../_components/auth";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "../_components/dropdown";
import { Link } from "../_components/link";
import {
  Navbar,
  NavbarDivider,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from "../_components/navbar";
import { Sidebar, SidebarHeader } from "../_components/sidebar";
import { StackedLayout } from "../_components/stacked-layout";
import { UserAvatar } from "../_components/user-avatar";
import { UserItem } from "./@selector/_components/user-item";
import FeedbackDialog, {
  FeedbackButton,
  FeedbackProvider,
} from "./_components/feedback";

// const navItems = [{ label: "Homepage", url: "/" }];

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
          <Link href="/" target="_blank">
            <Logo className="size-8 text-white" />
          </Link>
          <NavbarDivider className="max-lg:hidden" />
          <div className="max-lg:hidden">{selector}</div>
          {/* <NavbarSection className="max-lg:hidden">
            {navItems.map(({ label, url }) => (
              <NavbarItem key={label} href={url}>
                {label}
              </NavbarItem>
            ))}
          </NavbarSection> */}
          <NavbarSpacer />
          <NavbarSection>
            <FeedbackProvider>
              <Dropdown>
                <DropdownButton as={NavbarItem}>
                  <UserAvatar />
                </DropdownButton>
                <DropdownMenu className="min-w-64" anchor="bottom end">
                  <UserItem />
                  <DropdownDivider />
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
          <SidebarHeader>
            <div className="lg:mb-2.5">{selector}</div>
          </SidebarHeader>
        </Sidebar>
      }
    >
      {children}
    </StackedLayout>
  );
}
