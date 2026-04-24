"use client";

import SideNav from "~/app/(public)/_components/style/side-nav";
import type { PageWithMeta } from "~/types";
import { EIGENVAARDIGHEID_DISCIPLINES } from "../_data/eigenvaardigheid-disciplines";

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

              return (
                ctx.selectedLayoutSegments[0] === page.slug &&
                // For /eigenvaardigheid we only light up when on the overview,
                // not when drilled into /eigenvaardigheid/[discipline]/*.
                (page.slug !== "eigenvaardigheid" ||
                  ctx.selectedLayoutSegments.length === 1)
              );
            },
            label: page.title,
            href: `/diplomalijn/instructeur/${page.slug ? page.slug : ""}`,
          })),
        },
        {
          label: "Eigenvaardigheid per discipline",
          items: EIGENVAARDIGHEID_DISCIPLINES.map((d) => ({
            isActive(ctx) {
              return (
                ctx.selectedLayoutSegments[0] === "eigenvaardigheid" &&
                ctx.selectedLayoutSegments[1] === d.handle
              );
            },
            label: d.title,
            href: `/diplomalijn/instructeur/eigenvaardigheid/${d.handle}`,
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
