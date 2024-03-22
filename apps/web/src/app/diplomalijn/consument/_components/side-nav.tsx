"use client";

import SideNav from "~/app/_components/style/side-nav";
import type { PageWithMeta } from "~/app/types";

export default function SideNavVereniging({
  pages: { general },
}: {
  pages: {
    general: PageWithMeta[];
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
            href: `/diplomalijn/consument/${page.slug ? page.slug : ""}`,
          })),
        },
        // {
        //   label: "Disciplines",
        //   items: disciplines.map((page) => ({
        //     isActive(ctx) {
        //       return ctx.selectedLayoutSegments[1] === page.slug;
        //     },
        //     label: page.title,
        //     href: `/diplomalijn/consument/disciplines/${page.slug}`,
        //   })),
        // },
      ]}
      className="w-full sm:w-[18rem]"
    />
  );
}
