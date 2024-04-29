"use client";

import SideNav from "~/app/(public)/_components/style/side-nav";
import type { PageWithMeta } from "~/types";

export default function SideNavDiplomalijn({
  pages: { general, instructeur, leercoach, beoordelaar },
}: {
  pages: {
    general: PageWithMeta[];
    instructeur: PageWithMeta[];
    leercoach: PageWithMeta[];
    beoordelaar: PageWithMeta[];
  };
}) {
  return (
    <SideNav
      sections={[
        {
          items: general.map((page) => ({
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
          items: instructeur.map((page) => ({
            isActive(ctx) {
              return ctx.selectedLayoutSegments[0] === page.slug;
            },
            label: page.title,
            href: `/diplomalijn/instructeur/${page.slug}`,
          })),
        },
        {
          label: "Leercoach",
          items: leercoach.map((page) => ({
            isActive(ctx) {
              return (
                ctx.selectedLayoutSegments[0] === "leercoach" &&
                ctx.selectedLayoutSegments[1] === page.slug
              );
            },
            label: page.title,
            href: `/diplomalijn/instructeur/leercoach/${page.slug}`,
          })),
        },
        {
          label: "PvB-beoordelaar",
          items: beoordelaar.map((page) => ({
            isActive(ctx) {
              return (
                ctx.selectedLayoutSegments[0] === "pvb-beoordelaar" &&
                ctx.selectedLayoutSegments[1] === page.slug
              );
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
