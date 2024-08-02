import {
  ArrowRightStartOnRectangleIcon,
  LifebuoyIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
import Logo from "~/app/_components/brand/logo";
import { getAuthUserOrRedirect } from "~/lib/nwd";
import { LogOutDropdownItem } from "../_components/auth";
import { Avatar } from "../_components/avatar";
import {
  Dropdown,
  DropdownButton,
  DropdownDescription,
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
import FeedbackDialog, {
  FeedbackButton,
  FeedbackProvider,
} from "./_components/feedback";

// const navItems = [{ label: "Homepage", url: "/" }];

export default async function Layout({
  children,
  selector,
}: Readonly<{
  children: React.ReactNode;
  selector: React.ReactNode;
}>) {
  const user = await getAuthUserOrRedirect();

  return (
    <StackedLayout
      navbar={
        <Navbar>
          <Link href="/" target="_blank">
            <Logo className="text-white size-8" />
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
                  <Avatar
                    initials={(user.displayName ?? user.email).slice(0, 2)}
                    square
                  />
                </DropdownButton>
                <DropdownMenu className="min-w-64" anchor="bottom end">
                  <DropdownItem href="/account">
                    <UserIcon />
                    <DropdownLabel>Mijn account</DropdownLabel>
                    <DropdownDescription>{user.email}</DropdownDescription>
                  </DropdownItem>
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
