import { Sidebar, SidebarFooter } from "../../_components/sidebar";
import { UserSelector } from "../_components/user-selector";

interface LayoutProps {
  children: React.ReactNode;
}
export default function SidebarLayout({ children }: LayoutProps) {
  return (
    <Sidebar>
      {children}
      <SidebarFooter className="max-lg:hidden">
        <UserSelector />
      </SidebarFooter>
    </Sidebar>
  );
}

//   <SidebarHeader>
//   <LocationSelector currentLocationSlug={par} />
// </SidebarHeader>
// <SidebarBody>
//   <LocationSidebarMenu />
//   <LatestNews />
//   <SidebarSpacer />
//   <SidebarSection>
//     <SidebarItem href="/help" target="_blank">
//       <QuestionMarkCircleIcon />
//       <SidebarLabel>Helpcentrum</SidebarLabel>
//     </SidebarItem>
//     <SidebarItem href="/help" target="_blank">
//       <LightBulbIcon />
//       <SidebarLabel>Feedback delen</SidebarLabel>
//     </SidebarItem>
//   </SidebarSection>
// </SidebarBody>
