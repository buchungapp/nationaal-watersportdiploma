"use client";

import SideNav from "~/app/(public)/_components/style/side-nav";
import type { listDisciplines } from "~/lib/nwd";
import type { PageWithMeta } from "~/types";

export default function SideNavDiplomalijn({
  pages: { general },
  disciplines,
}: {
  pages: {
    general: PageWithMeta[];
  };
  disciplines: Awaited<ReturnType<typeof listDisciplines>>;
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
            href: `/diplomalijn/consument/${page.slug ? page.slug : ""}`,
          })),
        },
        {
          label: "Disciplines",
          items: disciplines.map((discipline) => ({
            isActive(ctx) {
              return ctx.selectedLayoutSegments[1] === discipline.handle;
            },
            label: discipline.title,
            href: `/diplomalijn/consument/disciplines/${discipline.handle}`,
          })),
        },
      ]}
      className="w-full sm:w-[18rem]"
    />
  );
}
