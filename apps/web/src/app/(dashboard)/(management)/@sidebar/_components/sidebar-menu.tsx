"use client";

import {
  AcademicCapIcon,
  RectangleStackIcon,
  UserGroupIcon,
} from "@heroicons/react/20/solid";
import { useParams } from "next/navigation";
import {
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "../../../_components/sidebar";

export function LocationSidebarMenu() {
  const params = useParams();

  const lastSegment = (params.routes as string[]).at(-1);

  return (
    <SidebarSection>
      {[
        {
          name: "Cohorten",
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          href: `/locatie/${params.location}/cohorten`,
          Icon: RectangleStackIcon,
          current: lastSegment === "cohorten",
        },
        {
          name: "Personen",
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          href: `/locatie/${params.location}/personen`,
          Icon: UserGroupIcon,
          current: lastSegment === "personen",
        },
        {
          name: "Diploma's",
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          href: `/locatie/${params.location}/diplomas`,
          Icon: AcademicCapIcon,
          current: lastSegment === "diplomas",
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
