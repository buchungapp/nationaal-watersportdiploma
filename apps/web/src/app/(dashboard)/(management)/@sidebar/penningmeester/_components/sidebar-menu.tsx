"use client";

import {
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "~/app/(dashboard)/_components/sidebar";

export function PenningmeesterSidebarMenu() {
  return (
    <SidebarSection>
      <SidebarItem href="/penningmeester" current>
        <SidebarLabel>Diploma's per locatie</SidebarLabel>
      </SidebarItem>
    </SidebarSection>
  );
}
