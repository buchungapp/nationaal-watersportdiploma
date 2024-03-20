"use client";

import SideNav from "~/app/_components/style/side-nav";
import {
  beoordelaarPages,
  generalPages,
  instructeurPages,
  leercoachPages,
} from "./segments";

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
