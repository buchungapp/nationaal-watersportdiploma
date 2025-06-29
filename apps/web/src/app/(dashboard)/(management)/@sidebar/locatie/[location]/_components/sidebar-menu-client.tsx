"use client";

import {
  AcademicCapIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  DocumentTextIcon,
  FolderIcon,
  UserGroupIcon,
} from "@heroicons/react/20/solid";
import { useParams, useSelectedLayoutSegments } from "next/navigation";
import {
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "~/app/(dashboard)/_components/sidebar";
import type { ActorType } from "~/lib/nwd";

export function LocationSidebarMenuClient({
  personRoles,
}: {
  personRoles: ActorType[];
}) {
  const segments = useSelectedLayoutSegments();
  const params = useParams();

  const hasRole = (role: ActorType[]) =>
    personRoles.some((r) => role.includes(r));

  return (
    <SidebarSection>
      {[
        {
          name: "Cohorten",
          href: `/locatie/${params.location}/cohorten`,
          Icon: CalendarDaysIcon,
          active: hasRole(["instructor", "location_admin"]),
          current: segments[0] === "cohorten",
        },
        {
          name: "Personen",
          href: `/locatie/${params.location}/personen`,
          Icon: UserGroupIcon,
          active: hasRole(["location_admin"]),
          current: segments[0] === "personen",
        },
        {
          name: "Diploma's",
          href: `/locatie/${params.location}/diplomas`,
          Icon: AcademicCapIcon,
          active: hasRole(["location_admin"]),
          current: segments[0] === "diplomas",
        },
        {
          name: "PvB aanvragen",
          href: `/locatie/${params.location}/pvb-aanvragen`,
          Icon: DocumentTextIcon,
          active: hasRole(["location_admin"]),
          current: segments[0] === "pvb-aanvragen",
        },
        {
          name: "Kennisbank",
          href: `/locatie/${params.location}/kennisbank`,
          Icon: FolderIcon,
          active: hasRole(["instructor", "location_admin"]),
          current: segments[0] === "kennisbank",
        },
        {
          name: "Inzichten",
          href: `/locatie/${params.location}/inzichten`,
          Icon: ChartBarIcon,
          active: hasRole(["location_admin"]),
          current: segments[0] === "inzichten",
        },
      ]
        .filter((item) => !!item.active)
        .map((item) => (
          <SidebarItem key={item.name} href={item.href} current={item.current}>
            <item.Icon />
            <SidebarLabel> {item.name}</SidebarLabel>
          </SidebarItem>
        ))}
    </SidebarSection>
  );
}
