import React from "react";

import MobileNav from "./mobile/MobileNav";
import MobileNavItems from "./mobile/MobileNavItems";
import StickyNav from "./sticky/StickyNav";
import StickyNavItems from "./sticky/StickyNavItems";

export interface NavItem {
  label: string;
  description: string;
  href: string;
  icon?: React.ReactNode;
}

export default function Nav({ items }: { items: NavItem[] }) {
  return (
    <>
      <MobileNav>
        <MobileNavItems items={items} />
      </MobileNav>
      <StickyNav>
        <StickyNavItems items={items} />
      </StickyNav>
    </>
  );
}