"use client";

import SideNav from "~/app/_components/style/side-nav";

const generalPages = [
  {
    label: "Introductie",
    description:
      "Voor instructeurs hebben we een speciale diplomalijn, op de gebieden van eigenvaardigheid, didactiek en begeleiding.",
    slug: null,
  },
  {
    label: "Overgang CWO",
    description:
      "Informatie over de overstap als instructeur van het CWO-systeem naar het Nationaal Watersportdiploma.",
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

const eigenvaardigheidPages = [
  {
    label: "Eigenvaardigheid I",
    slug: "eigenvaardigheid-i",
  },
  {
    label: "Eigenvaardigheid II",
    slug: "eigenvaardigheid-ii",
  },
  {
    label: "Eigenvaardigheid III",
    slug: "eigenvaardigheid-iii",
  },
];

const instructeurPages = [
  {
    label: "Instructeur 1 (I1)",
    slug: "instructeur-1",
  },
  {
    label: "Instructeur 2 (I2)",
    slug: "instructeur-2",
  },
  {
    label: "Instructeur 3 (I3)",
    slug: "instructeur-3",
  },
  {
    label: "Instructeur 4 (I4)",
    slug: "instructeur-4",
  },
  {
    label: "Instructeur 5 (I5)",
    slug: "instructeur-5",
  },
];

const leercoachPages = [
  {
    label: "Leercoach 4 (L4)",
    slug: "leercoach-4",
  },
  {
    label: "Leercoach 5 (L5)",
    slug: "leercoach-5",
  },
];

const beoordelaarPages = [
  {
    label: "PvB-beoordelaar 4 (B4)",
    slug: "pvb-beoordelaar-4",
  },
  {
    label: "PvB-beoordelaar 5 (B5)",
    slug: "pvb-beoordelaar-5",
  },
];

export const instructeursPages = [...generalPages, ...eigenvaardigheidPages];

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
            href: `/diplomalijn/instructeur/${page.slug ? page.slug : ""}`,
          })),
        },
        {
          label: "Instructeur",
          items: instructeurPages.map((page) => ({
            isActive(ctx) {
              return ctx.selectedLayoutSegments[0] === page.slug;
            },
            label: page.label,
            href: `/diplomalijn/instructeur/${page.slug}`,
          })),
        },
        {
          label: "Leercoach",
          items: leercoachPages.map((page) => ({
            isActive(ctx) {
              return ctx.selectedLayoutSegments[1] === page.slug;
            },
            label: page.label,
            href: `/diplomalijn/instructeur/leercoach/${page.slug}`,
          })),
        },
        {
          label: "PvB-beoordelaar",
          items: beoordelaarPages.map((page) => ({
            isActive(ctx) {
              return ctx.selectedLayoutSegments[1] === page.slug;
            },
            label: page.label,
            href: `/diplomalijn/instructeur/pvb-beoordelaar/${page.slug}`,
          })),
        },
      ]}
      className="w-full sm:w-[18rem]"
    />
  );
}
