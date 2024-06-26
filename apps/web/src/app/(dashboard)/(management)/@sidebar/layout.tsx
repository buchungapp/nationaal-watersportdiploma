import { Sidebar, SidebarFooter } from "../../_components/sidebar";
import { UserSelector } from "./_components/user-selector";

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
