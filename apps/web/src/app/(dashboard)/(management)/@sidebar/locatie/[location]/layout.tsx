import {
  BookOpenIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/20/solid";
import {
  SidebarBody,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from "~/app/(dashboard)/_components/sidebar";
import { listRolesForLocation, retrieveLocationByHandle } from "~/lib/nwd";
import LatestNews from "../../_components/latest-news";
import Feedback from "./_components/feedback";
import { LocationSelector } from "./_components/location-selector";
import { LocationSidebarMenu } from "./_components/sidebar-menu";

interface LayoutProps {
  children: React.ReactNode;
  params: {
    location: string;
  };
}
export default async function SidebarLayout({ params, children }: LayoutProps) {
  const location = await retrieveLocationByHandle(params.location);
  const rolesForPerson = await listRolesForLocation(location.id);

  return (
    <>
      {children}
      <SidebarHeader>
        <LocationSelector currentLocationSlug={params.location} />
      </SidebarHeader>
      <SidebarBody>
        <LocationSidebarMenu personRoles={rolesForPerson} />
        <LatestNews />
        <SidebarSpacer />
        <SidebarSection>
          <SidebarItem href="/diplomalijn/consument" target="_blank">
            <BookOpenIcon />
            <SidebarLabel>Diplomalijnen</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="/help" target="_blank">
            <QuestionMarkCircleIcon />
            <SidebarLabel>Helpcentrum</SidebarLabel>
          </SidebarItem>
          <Feedback />
        </SidebarSection>
      </SidebarBody>
    </>
  );
}
