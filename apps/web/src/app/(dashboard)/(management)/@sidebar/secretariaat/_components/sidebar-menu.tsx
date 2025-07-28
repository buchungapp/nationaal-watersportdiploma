"use client";

import { useSelectedLayoutSegments } from "next/navigation";

import {
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "~/app/(dashboard)/_components/sidebar";

export function SecretariaatSidebarMenu() {
  const segments = useSelectedLayoutSegments();

  const lastSegment = segments.at(-1);

  return (
    <>
      <SidebarSection>
        <SidebarHeading>Diplomalijn</SidebarHeading>
        {[
          {
            name: "Cursussen",
            href: "/secretariaat/diplomalijn/cursussen",
            current: segments.slice(0, 2).join("/") === "diplomalijn/cursussen",
          },
          {
            name: "Modules",
            href: "/secretariaat/diplomalijn/modules",
            current: segments.slice(0, 2).join("/") === "diplomalijn/modules",
          },
          {
            name: "Competenties",
            href: "/secretariaat/diplomalijn/competenties",
            current:
              segments.slice(0, 2).join("/") === "diplomalijn/competenties",
          },
          {
            name: "Materialen",
            href: "/secretariaat/diplomalijn/materialen",
            current:
              segments.slice(0, 2).join("/") === "diplomalijn/materialen",
          },
          {
            name: "Disciplines",
            href: "/secretariaat/diplomalijn/disciplines",
            current:
              segments.slice(0, 2).join("/") === "diplomalijn/disciplines",
          },
          {
            name: "Niveaus",
            href: "/secretariaat/diplomalijn/niveaus",
            current: segments.slice(0, 2).join("/") === "diplomalijn/niveaus",
          },
          {
            name: "Categorieën",
            href: "/secretariaat/diplomalijn/categorieen",
            current:
              segments.slice(0, 2).join("/") === "diplomalijn/categorieen",
          },
        ].map((item) => (
          <SidebarItem key={item.name} href={item.href} current={item.current}>
            <SidebarLabel> {item.name}</SidebarLabel>
          </SidebarItem>
        ))}
      </SidebarSection>

      <SidebarSection>
        <SidebarHeading>KSS</SidebarHeading>
        {[
          {
            name: "Overzicht",
            href: "/secretariaat/kss",
            current: segments[0] === "kss" && !segments[1],
          },
          {
            name: "Kwalificatieprofielen",
            href: "/secretariaat/kss/kwalificatieprofielen",
            current:
              segments.slice(0, 2).join("/") === "kss/kwalificatieprofielen",
          },
          {
            name: "Kerntaken",
            href: "/secretariaat/kss/kerntaken",
            current: segments.slice(0, 2).join("/") === "kss/kerntaken",
          },
          {
            name: "Instructiegroepen",
            href: "/secretariaat/kss/instructiegroepen",
            current: segments.slice(0, 2).join("/") === "kss/instructiegroepen",
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
            href: "/secretariaat/locaties",
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
            href: "/secretariaat/gebruikers",
            current: lastSegment === "gebruikers",
          },
          {
            name: "Instructeurs",
            href: "/secretariaat/instructeurs",
            current: lastSegment === "instructeurs",
          },
        ].map((item) => (
          <SidebarItem key={item.name} href={item.href} current={item.current}>
            <SidebarLabel> {item.name}</SidebarLabel>
          </SidebarItem>
        ))}
      </SidebarSection>

      <SidebarSection>
        <SidebarHeading>Opleidingen</SidebarHeading>
        {[
          {
            name: "Diploma's",
            href: "/secretariaat/opleidingen/diplomas",
            current: lastSegment === "diplomas",
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
