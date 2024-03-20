"use client";

import SideNav from "~/app/_components/style/side-nav";
import type { LayoutSegment, Page } from "~/app/types";

const verenigingsPages: Page[] = [
  {
    title: "Manifest",
    slug: "manifest",
    description: "Waar we in geloven bij het Nationaal Watersportdiploma.",
  },
  {
    title: "Vertrouwenspersoon",
    slug: "vertrouwenspersoon",
    description: "Ondersteuning en advies bij ongewenst gedrag.",
  },
  {
    title: "Gedragscode",
    slug: "gedragscode",
    description:
      "Gezamenlijke afspraken tussen alle betrokkenen bij NWD-vaarlocaties.",
  },
  {
    title: "Bestuur",
    slug: "bestuur",
    description:
      "Maak kennis met het bestuur van de vereniging Nationaal Watersportdiploma.",
  },
  {
    title: "Secretariaat",
    slug: "secretariaat",
    description: "Eerste aanspreekpunt voor het Nationaal Watersportdiploma.",
  },
  {
    title: "Kwaliteitscommissie",
    slug: "kwaliteitscommissie",
    description:
      "De kwaliteitscommissie bewaakt de kwaliteit van aangesloten locaties bij het Nationaal Watersportdiploma.",
  },
  {
    title: "Statuten en reglementen",
    slug: "statuten-reglementen",
    description:
      "De statuten en reglementen van het Nationaal Watersportdiploma.",
  },
];

export const segments: LayoutSegment[] = [
  {
    parentSegments: [],
    pages: verenigingsPages,
  },
];

export default function SideNavVereniging() {
  return (
    <SideNav
      sections={[
        {
          label: "Verenigingszaken",
          items: verenigingsPages.map((page) => ({
            isActive(ctx) {
              return ctx.selectedLayoutSegments[0] === page.slug;
            },
            label: page.title,
            href: `/vereniging/${page.slug}`,
          })),
        },
      ]}
      className="w-full sm:w-[18rem]"
    />
  );
}
