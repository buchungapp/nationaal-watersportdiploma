/* eslint-disable @typescript-eslint/restrict-template-expressions */
"use client";

import {
  AcademicCapIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  UserGroupIcon,
} from "@heroicons/react/20/solid";
import { useParams, useSelectedLayoutSegments } from "next/navigation";
import {
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "../../../../../_components/sidebar";

export function LocationSidebarMenu() {
  const segments = useSelectedLayoutSegments();
  const params = useParams();

  const lastSegment = segments.at(-1);

  return (
    <SidebarSection>
      {[
        {
          name: "Cohorten",
          href: `/locatie/${params.location}/cohorten`,
          Icon: CalendarDaysIcon,
          current: lastSegment === "cohorten",
        },
        {
          name: "Personen",
          href: `/locatie/${params.location}/personen`,
          Icon: UserGroupIcon,
          current: lastSegment === "personen",
        },
        {
          name: "Diploma's",
          href: `/locatie/${params.location}/diplomas`,
          Icon: AcademicCapIcon,
          current: lastSegment === "diplomas",
        },
        {
          name: "Inzichten",
          href: `/locatie/${params.location}/inzichten`,
          Icon: ChartBarIcon,
          current: lastSegment === "inzichten",
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
