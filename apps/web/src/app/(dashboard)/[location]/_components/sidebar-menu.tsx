"use client";

import {
  AcademicCapIcon,
  RectangleStackIcon,
  UserGroupIcon,
} from "@heroicons/react/20/solid";
import { useParams, useSelectedLayoutSegment } from "next/navigation";
import {
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "../../_components/sidebar";

export function LocationSidebarMenu() {
  const segment = useSelectedLayoutSegment();
  const params = useParams();

  return (
    <SidebarSection>
      {[
        {
          name: "Cohorten",
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          href: `/${params.location}/cohorten`,
          Icon: RectangleStackIcon,
          current: segment === "cohorten",
        },
        {
          name: "Personen",
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          href: `/${params.location}/personen`,
          Icon: UserGroupIcon,
          current: segment === "personen",
        },
        {
          name: "Diploma's",
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          href: `/${params.location}/diplomas`,
          Icon: AcademicCapIcon,
          current: segment === "diplomas",
        },
      ].map((item) => (
        <SidebarItem key={item.name} href={item.href} current={item.current}>
          <item.Icon />
          <SidebarLabel> {item.name}</SidebarLabel>
        </SidebarItem>
      ))}
    </SidebarSection>
  );
}
