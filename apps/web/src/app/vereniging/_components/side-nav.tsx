"use client";

import SideNav from "~/app/_components/style/side-nav";

export const verenigingsPages = [
  {
    label: "Manifest",
    slug: "manifest",
    description: "Waar we in geloven bij het Nationaal Watersportdiploma.",
  },
  {
    label: "Vertrouwenspersoon",
    slug: "vertrouwenspersoon",
    description: "Ondersteuning en advies bij ongewenst gedrag.",
  },
  {
    label: "Gedragscode",
    slug: "gedragscode",
    description:
      "Gezamenlijke afspraken tussen alle betrokkenen bij NWD-vaarlocaties.",
  },
  {
    label: "Bestuur",
    slug: "bestuur",
    description:
      "Maak kennis met het bestuur van de vereniging Nationaal Watersportdiploma.",
  },
  {
    label: "Secretariaat",
    slug: "secretariaat",
    description: "Eerste aanspreekpunt voor het Nationaal Watersportdiploma.",
  },
  {
    label: "Kwaliteitscommissie",
    slug: "kwaliteitscommissie",
    description:
      "De kwaliteitscommissie bewaakt de kwaliteit van aangesloten locaties bij het Nationaal Watersportdiploma.",
  },
  {
    label: "Statuten en reglementen",
    slug: "statuten-reglementen",
    description:
      "De statuten en reglementen van het Nationaal Watersportdiploma.",
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
            label: page.label,
            href: `/vereniging/${page.slug}`,
          })),
        },
      ]}
      className="w-full sm:w-[18rem]"
    />
  );
}
