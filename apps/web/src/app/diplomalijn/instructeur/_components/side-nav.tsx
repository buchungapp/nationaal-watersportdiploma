"use client";

import SideNav from "~/app/_components/style/side-nav";
import type { LayoutSegment, Page } from "~/app/types";

const generalPages: Page[] = [
  {
    title: "Introductie",
    description:
      "Voor instructeurs hebben we een speciale diplomalijn, op de gebieden van eigenvaardigheid, didactiek en begeleiding.",
    slug: null,
  },
  {
    title: "Overgang CWO",
    description:
      "Informatie over de overstap als instructeur van het CWO-systeem naar het Nationaal Watersportdiploma.",
    slug: "overgang-cwo",
  },
  {
    title: "Erkenningen",
    description:
      "Leer meer over de erkenning van het Nationaal Watersportdiploma.",
    slug: "erkenningen",
  },
  {
    title: "Veelgestelde vragen",
    description:
      "Vind hier antwoorden op veelgestelde vragen over het Nationaal Watersportdiploma.",
    slug: "veelgestelde-vragen",
  },
];

const eigenvaardigheidPages: Page[] = [
  {
    title: "Eigenvaardigheid I",
    slug: "eigenvaardigheid-i",
  },
  {
    title: "Eigenvaardigheid II",
    slug: "eigenvaardigheid-ii",
  },
  {
    title: "Eigenvaardigheid III",
    slug: "eigenvaardigheid-iii",
  },
];

const instructeurPages: Page[] = [
  {
    title: "Instructeur 1 (I1)",
    slug: "niveau-1",
  },
  {
    title: "Instructeur 2 (I2)",
    slug: "niveau-2",
  },
  {
    title: "Instructeur 3 (I3)",
    slug: "niveau-3",
  },
  {
    title: "Instructeur 4 (I4)",
    slug: "niveau-4",
  },
  {
    title: "Instructeur 5 (I5)",
    slug: "niveau-5",
  },
];

const leercoachPages: Page[] = [
  {
    title: "Leercoach 4 (L4)",
    slug: "niveau-4",
  },
  {
    title: "Leercoach 5 (L5)",
    slug: "niveau-5",
  },
];

const beoordelaarPages: Page[] = [
  {
    title: "PvB-beoordelaar 4 (B4)",
    slug: "niveau-4",
  },
  {
    title: "PvB-beoordelaar 5 (B5)",
    slug: "niveau-5",
  },
];

export const segments: LayoutSegment[] = [
  {
    parentSegments: [],
    pages: generalPages,
  },
  {
    parentSegments: ["eigenvaardigheid"],
    pages: eigenvaardigheidPages,
  },
  {
    parentSegments: ["instructeur"],
    pages: instructeurPages,
  },
  {
    parentSegments: ["leercoach"],
    pages: leercoachPages,
  },
  {
    parentSegments: ["pvb-beoordelaar"],
    pages: beoordelaarPages,
  },
];

export default function SideNavVereniging() {
  return (
    <SideNav
      sections={[
        {
          items: generalPages.map((page) => ({
            isActive(ctx) {
              if (page.slug === null)
                return ctx.selectedLayoutSegments.length < 1;

              return ctx.selectedLayoutSegments[0] === page.slug;
            },
            label: page.title,
            href: `/diplomalijn/instructeur/${page.slug ? page.slug : ""}`,
          })),
        },
        {
          label: "Instructeur",
          items: instructeurPages.map((page) => ({
            isActive(ctx) {
              return ctx.selectedLayoutSegments[0] === page.slug;
            },
            label: page.title,
            href: `/diplomalijn/instructeur/${page.slug}`,
          })),
        },
        {
          label: "Leercoach",
          items: leercoachPages.map((page) => ({
            isActive(ctx) {
              return ctx.selectedLayoutSegments[1] === page.slug;
            },
            label: page.title,
            href: `/diplomalijn/instructeur/leercoach/${page.slug}`,
          })),
        },
        {
          label: "PvB-beoordelaar",
          items: beoordelaarPages.map((page) => ({
            isActive(ctx) {
              return ctx.selectedLayoutSegments[1] === page.slug;
            },
            label: page.title,
            href: `/diplomalijn/instructeur/pvb-beoordelaar/${page.slug}`,
          })),
        },
      ]}
      className="w-full sm:w-[18rem]"
    />
  );
}
