"use client";

import SideNav from "~/app/_components/style/side-nav";

const generalPages = [
  {
    label: "Introductie",
    description:
      "Als je wilt leren varen, vind je hier alle informatie over de diplomalijn van het Nationaal Watersportdiploma.",
    slug: null,
  },
  {
    label: "Overgang CWO",
    description:
      "Als je al een CWO-diploma hebt, vind je hier informatie over de overstap naar het Nationaal Watersportdiploma.",
    slug: "overgang-cwo",
  },
  {
    label: "Erkenningen",
    description:
      "Leer meer over de erkenning van het Nationaal Watersportdiploma.",
    slug: "erkenningen",
  },
  {
    label: "Veelgestelde vragen",
    description:
      "Vind hier antwoorden op veelgestelde vragen over het Nationaal Watersportdiploma.",
    slug: "veelgestelde-vragen",
  },
];

const disciplinePages = [
  {
    label: "Catamaran",
    slug: "catamaran",
  },
  {
    label: "Jachtzeilen",
    slug: "jachtzeilen",
  },
  {
    label: "Kielboot",
    slug: "kielboot",
  },
  {
    label: "Windsurfen",
    slug: "windsurfen",
  },
  {
    label: "Zwaardboot 1-mans",
    slug: "zwaardboot-1mans",
  },
  {
    label: "Zwaardboot 2-mans",
    slug: "zwaardboot-2mans",
  },
];

export const consumentenPages = [...generalPages, ...disciplinePages];

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
            label: page.label,
            href: `/diplomalijn/consument/${page.slug ? page.slug : ""}`,
          })),
        },
        {
          label: "Disciplines",
          items: disciplinePages.map((page) => ({
            isActive(ctx) {
              return ctx.selectedLayoutSegments[1] === page.slug;
            },
            label: page.label,
            href: `/diplomalijn/consument/disciplines/${page.slug}`,
          })),
        },
      ]}
      className="w-full sm:w-[18rem]"
    />
  );
}
