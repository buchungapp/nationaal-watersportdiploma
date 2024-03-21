import type { LayoutSegment, Page } from "~/app/types";

export const generalPages: Page[] = [
  {
    title: "Introductie",
    description:
      "Als je wilt leren varen, vind je hier alle informatie over de diplomalijn van het Nationaal Watersportdiploma.",
    slug: null,
    weight: 0.8,
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
    weight: 0.6,
  },
  {
    title: "Veelgestelde vragen",
    description:
      "Vind hier antwoorden op veelgestelde vragen over het Nationaal Watersportdiploma.",
    slug: "veelgestelde-vragen",
  },
];

export const disciplinePages: Page[] = [
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

export const consumentSegments: LayoutSegment[] = [
  {
    parentSegments: [],
    pages: generalPages,
  },
  {
    parentSegments: ["disciplines"],
    pages: disciplinePages,
  },
];
