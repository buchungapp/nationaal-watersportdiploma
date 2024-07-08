import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  Cog8ToothIcon,
  LifebuoyIcon,
  ShieldCheckIcon,
} from "@heroicons/react/16/solid";
import { getUserOrThrow, listPersonsForUser } from "~/lib/nwd";
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
  NavbarLabel,
  NavbarSection,
  NavbarSpacer,
} from "../_components/navbar";
import {
  Sidebar,
  SidebarBody,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "../_components/sidebar";
import { StackedLayout } from "../_components/stacked-layout";
import FeedbackDialog, {
  FeedbackButton,
  FeedbackProvider,
} from "./_components/feedback";

const navItems = [
  // { label: "Paspoort", url: "/profiel" },
  // { label: "Diploma's", url: "/diploma" },
  { label: "Vaarlocaties", url: "/profiel" },
] as const;

function PersonDropdownMenu() {
  return (
    <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
      {/* <DropdownItem href="/teams/1">
        <Avatar slot="icon" src="/tailwind-logo.svg" />
        <DropdownLabel>Tailwind Labs</DropdownLabel>
      </DropdownItem>
      <DropdownItem href="/teams/2">
        <Avatar
          slot="icon"
          initials="WC"
          className="bg-purple-500 text-white "
        />
        <DropdownLabel>Workcation</DropdownLabel>
      </DropdownItem> */}
      <DropdownDivider />
      <DropdownItem href="/profiel/personen">
        <Cog8ToothIcon />
        <DropdownLabel>Beheer personen</DropdownLabel>
      </DropdownItem>
    </DropdownMenu>
  );
}

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserOrThrow();
  const persons = await listPersonsForUser().catch(() => null);

  if (!persons || persons.length < 1) {
    return (
      <StackedLayout
        navbar={
          <Navbar>
            <NavbarSpacer />
            <NavbarSection>
              <FeedbackProvider>
                <Dropdown>
                  <DropdownButton as={NavbarItem}>
                    <Avatar
                      src=""
                      initials={user.displayName ?? user.email.slice(0, 2)}
                      square
                    />
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
            <SidebarHeader></SidebarHeader>
            <SidebarBody>
              <SidebarSection>
                {navItems.map(({ label, url }) => (
                  <SidebarItem key={label} href={url}>
                    {label}
                  </SidebarItem>
                ))}
              </SidebarSection>
            </SidebarBody>
          </Sidebar>
        }
      >
        {children}
      </StackedLayout>
    );
  }

  const firstPerson = persons[0]!;

  return (
    <StackedLayout
      navbar={
        <Navbar>
          <Dropdown>
            <DropdownButton as={NavbarItem} className="max-lg:hidden">
              <Avatar src={""} initials={firstPerson.firstName.slice(0, 2)} />
              <NavbarLabel>
                {[
                  firstPerson.firstName,
                  firstPerson.lastNamePrefix,
                  firstPerson.lastName,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </NavbarLabel>
              <ChevronDownIcon />
            </DropdownButton>
            <PersonDropdownMenu />
          </Dropdown>
          <NavbarDivider className="max-lg:hidden" />
          <NavbarSection className="max-lg:hidden">
            {navItems.map(({ label, url }) => (
              <NavbarItem key={label} href={url}>
                {label}
              </NavbarItem>
            ))}
          </NavbarSection>
          <NavbarSpacer />
          <NavbarSection>
            <FeedbackProvider>
              <Dropdown>
                <DropdownButton as={NavbarItem}>
                  <Avatar
                    src=""
                    initials={user.displayName ?? user.email.slice(0, 2)}
                    square
                  />
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
          <SidebarHeader>
            <Dropdown>
              <DropdownButton as={SidebarItem} className="lg:mb-2.5">
                <Avatar
                  src={undefined}
                  initials={user.displayName ?? user.email.slice(0, 2)}
                />
                <SidebarLabel>Nationaal Watersportdiploma</SidebarLabel>
                <ChevronDownIcon />
              </DropdownButton>
              <PersonDropdownMenu />
            </Dropdown>
          </SidebarHeader>
          <SidebarBody>
            <SidebarSection>
              {navItems.map(({ label, url }) => (
                <SidebarItem key={label} href={url}>
                  {label}
                </SidebarItem>
              ))}
            </SidebarSection>
          </SidebarBody>
        </Sidebar>
      }
    >
      {children}
    </StackedLayout>
  );
}
