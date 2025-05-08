import { QuestionMarkCircleIcon } from "@heroicons/react/20/solid";
import {
  SidebarBody,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from "~/app/(dashboard)/_components/sidebar";
import LatestNews from "../../_components/latest-news";
import Feedback from "./_components/feedback";
import { LocationSelector } from "./_components/location-selector";
import { LocationSidebarMenu } from "./_components/sidebar-menu";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    location: string;
  }>;
}
export default function SidebarLayout({ children, params }: LayoutProps) {
  return (
    <>
      {children}
      <SidebarHeader>
        <LocationSelector params={params} />
      </SidebarHeader>
      <SidebarBody>
        <LocationSidebarMenu params={params} />
        <LatestNews />
        <SidebarSpacer />
        <SidebarSection>
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
