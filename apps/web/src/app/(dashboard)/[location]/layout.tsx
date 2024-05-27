// import LatestNews from "./_components/latest-news";
// import { LocationSelector } from "./_components/location-selector";
// import { LocationSidebarMenu } from "./_components/sidebar-menu";
// import { UserSelector } from "./_components/user-selector";

import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  Cog8ToothIcon,
  InboxIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
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
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from "../_components/sidebar";
import { SidebarLayout } from "../_components/sidebar-layout";
import LatestNews from "./_components/latest-news";
import { LocationSidebarMenu } from "./_components/sidebar-menu";
import { UserSelector } from "./_components/user-selector";

export default function Layout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { location: string };
}>) {
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
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <Dropdown>
              <DropdownButton as={SidebarItem} className="lg:mb-2.5">
                <Avatar src="/tailwind-logo.svg" />
                <SidebarLabel>Tailwind Labs</SidebarLabel>
                <ChevronDownIcon />
              </DropdownButton>
              <DropdownMenu
                className="min-w-80 lg:min-w-64"
                anchor="bottom start"
              >
                <DropdownItem href="/teams/1/settings">
                  <Cog8ToothIcon />
                  <DropdownLabel>Settings</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/teams/1">
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
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/teams/create">
                  <PlusIcon />
                  <DropdownLabel>New team&hellip;</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </SidebarHeader>
          <SidebarBody>
            <LocationSidebarMenu />
            <LatestNews />
            <SidebarSpacer />
            <SidebarSection>
              <SidebarItem href="/help">
                <QuestionMarkCircleIcon />
                <SidebarLabel>Helpcentrum</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/help">
                <LightBulbIcon />
                <SidebarLabel>Feedback delen</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>
          <SidebarFooter className="max-lg:hidden">
            <UserSelector />
          </SidebarFooter>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
    // <>
    //   <div className="fixed inset-y-0 hidden w-72 flex-col sm:flex">
    //     <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6">
    //       <div className="flex h-16 shrink-0 items-center">
    //         <img
    //           className="h-8 w-auto"
    //           src="https://www.nationaalwatersportdiploma.nl/_next/static/media/NWD-logo-final.92b2eb4c.svg"
    //           alt="Nationaal Watersportdiploma"
    //         />
    //       </div>
    //       <nav className="flex flex-1 flex-col">
    //         <ul role="list" className="flex flex-1 flex-col gap-y-7">
    //           <li className="">
    //             <LocationSelector currentLocationSlug={params.location} />
    //           </li>
    //           <li>
    //             <LocationSidebarMenu />
    //           </li>
    //           <li>
    //             <div className="text-xs font-semibold leading-6 text-gray-400">
    //               Actueel
    //             </div>
    //             <LatestNews />
    //           </li>
    //           <li className="mt-auto pb-4">
    //             <UserSelector />
    //           </li>
    //         </ul>
    //       </nav>
    //     </div>
    //   </div>

    //   <main className="py-2.5 h-screen flex flex-col lg:pl-72 pr-2.5">
    //     <div className="px-4 sm:px-8 shadow flex-1 ring-1 ring-gray-200 rounded min-h-full lg:px-12 bg-white overflow-y-auto">
    //       {children}
    //     </div>
    //   </main>
    // </>
  );
}
