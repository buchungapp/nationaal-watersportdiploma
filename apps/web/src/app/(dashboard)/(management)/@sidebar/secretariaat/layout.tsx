import { Subheading } from "~/app/(dashboard)/_components/heading";
import {
  SidebarBody,
  SidebarHeader,
} from "~/app/(dashboard)/_components/sidebar";
import { SecretariaatSidebarMenu } from "./_components/sidebar-menu";

interface LayoutProps {
  children: React.ReactNode;
}
export default function SidebarLayout({ children }: LayoutProps) {
  return (
    <>
      {children}
      <SidebarHeader>
        <Subheading level={3}>Secretariaat</Subheading>
      </SidebarHeader>
      <SidebarBody>
        <SecretariaatSidebarMenu />
      </SidebarBody>
    </>
  );
}
