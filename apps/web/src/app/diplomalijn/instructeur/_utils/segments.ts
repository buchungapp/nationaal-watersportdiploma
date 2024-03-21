import type { LayoutSegment, Page } from "~/app/types";
export const generalPages: Page[] = [
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

export const eigenvaardigheidPages: Page[] = [
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

export const instructeurPages: Page[] = [
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

export const leercoachPages: Page[] = [
  {
    title: "Leercoach 4 (L4)",
    slug: "niveau-4",
  },
  {
    title: "Leercoach 5 (L5)",
    slug: "niveau-5",
  },
];

export const beoordelaarPages: Page[] = [
  {
    title: "PvB-beoordelaar 4 (B4)",
    slug: "niveau-4",
  },
  {
    title: "PvB-beoordelaar 5 (B5)",
    slug: "niveau-5",
  },
];

export const instructeurSegments: LayoutSegment[] = [
  {
    parentSegments: [],
    pages: generalPages,
  },
  {
    parentSegments: ["eigenvaardigheid"],
    pages: eigenvaardigheidPages,
  },
  {
    parentSegments: [],
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
