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
} from "../../../_components/sidebar";

export function LocationSidebarMenu() {
  const segments = useSelectedLayoutSegments();
  const params = useParams();

  console.log("segments :>> ", segments);

  const lastSegment = segments.at(-1);

  return (
    <SidebarSection>
      {[
        {
          name: "Cohorten",
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          href: `/locatie/${params.location}/cohorten`,
          Icon: CalendarDaysIcon,
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
        {
          name: "Rapportages",
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          href: `/locatie/${params.location}/rapportages`,
          Icon: ChartBarIcon,
          current: lastSegment === "rapportages",
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
