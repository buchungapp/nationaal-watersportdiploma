"use client";

import SideNav from "~/app/_components/style/side-nav";
import type { LayoutSegment, Page } from "~/app/types";

const generalPages: Page[] = [
  {
    title: "Introductie",
    description:
      "Als je wilt leren varen, vind je hier alle informatie over de diplomalijn van het Nationaal Watersportdiploma.",
    slug: null,
  },
  {
    title: "Overgang CWO",
    description:
      "Als je al een CWO-diploma hebt, vind je hier informatie over de overstap naar het Nationaal Watersportdiploma.",
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

const disciplinePages: Page[] = [
  {
    title: "Catamaran",
    slug: "catamaran",
  },
  {
    title: "Jachtzeilen",
    slug: "jachtzeilen",
  },
  {
    title: "Kielboot",
    slug: "kielboot",
  },
  {
    title: "Windsurfen",
    slug: "windsurfen",
  },
  {
    title: "Zwaardboot 1-mans",
    slug: "zwaardboot-1mans",
  },
  {
    title: "Zwaardboot 2-mans",
    slug: "zwaardboot-2mans",
  },
];

export const segments: LayoutSegment[] = [
  {
    parentSegments: [],
    pages: generalPages,
  },
  {
    parentSegments: ["disciplines"],
    pages: disciplinePages,
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
            href: `/diplomalijn/consument/${page.slug ? page.slug : ""}`,
          })),
        },
        {
          label: "Disciplines",
          items: disciplinePages.map((page) => ({
            isActive(ctx) {
              return ctx.selectedLayoutSegments[1] === page.slug;
            },
            label: page.title,
            href: `/diplomalijn/consument/disciplines/${page.slug}`,
          })),
        },
      ]}
      className="w-full sm:w-[18rem]"
    />
  );
}
