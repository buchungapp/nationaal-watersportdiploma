"use client";

import SideNav from "~/app/_components/style/side-nav";
import { verenigingsPages } from "../_utils/segments";

export default function SideNavVereniging() {
  return (
    <SideNav
      sections={[
        {
          label: "Verenigingszaken",
          items: verenigingsPages.map((page) => ({
            isActive(ctx) {
              return ctx.selectedLayoutSegments[0] === page.slug;
            },
            label: page.title,
            href: `/vereniging/${page.slug}`,
          })),
        },
      ]}
      className="w-full sm:w-[18rem]"
    />
  );
}
