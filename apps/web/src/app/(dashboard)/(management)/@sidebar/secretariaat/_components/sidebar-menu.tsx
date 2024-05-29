/* eslint-disable @typescript-eslint/restrict-template-expressions */
"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import {
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "../../../../_components/sidebar";

export function SecretariaatSidebarMenu() {
  const segments = useSelectedLayoutSegments();

  const lastSegment = segments.at(-1);

  return (
    <>
      <SidebarSection>
        <SidebarHeading>Diplomalijn</SidebarHeading>
        {[
          {
            name: "Programma's",
            href: `/secretariaat/diplomalijn/programmas`,
            current: lastSegment === "programmas",
          },
          {
            name: "Modules",
            href: `/secretariaat/diplomalijn/modules`,
            current: lastSegment === "modules",
          },
          {
            name: "Competenties",
            href: `/secretariaat/diplomalijn/competenties`,
            current: lastSegment === "competenties",
          },
        ].map((item) => (
          <SidebarItem key={item.name} href={item.href} current={item.current}>
            <SidebarLabel> {item.name}</SidebarLabel>
          </SidebarItem>
        ))}
      </SidebarSection>

      <SidebarSection>
        <SidebarHeading>Vaarlocaties</SidebarHeading>
        {[
          {
            name: "Overzicht",
            href: `/secretariaat/locaties`,
            current: lastSegment === "cohorten",
          },
        ].map((item) => (
          <SidebarItem key={item.name} href={item.href} current={item.current}>
            <SidebarLabel> {item.name}</SidebarLabel>
          </SidebarItem>
        ))}
      </SidebarSection>

      <SidebarSection>
        <SidebarHeading>Gebruikers</SidebarHeading>
        {[
          {
            name: "Overzicht",
            href: `/secretariaat/gebruikers`,
            current: lastSegment === "cohorten",
          },
        ].map((item) => (
          <SidebarItem key={item.name} href={item.href} current={item.current}>
            <SidebarLabel> {item.name}</SidebarLabel>
          </SidebarItem>
        ))}
      </SidebarSection>

      <SidebarSection>
        <SidebarHeading>Diploma's</SidebarHeading>
        {[
          {
            name: "Overzicht",
            href: `/secretariaat/diplomas`,
            current: lastSegment === "cohorten",
          },
        ].map((item) => (
          <SidebarItem key={item.name} href={item.href} current={item.current}>
            <SidebarLabel> {item.name}</SidebarLabel>
          </SidebarItem>
        ))}
      </SidebarSection>
    </>
  );
}
