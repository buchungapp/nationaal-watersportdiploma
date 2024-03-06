import Link from "next/link";

import Hero from "~/app/_assets/Hero";
import Logo from "~/app/_assets/Logo";
import { type NavItem } from "../Nav";
import { MobileNavButton } from "../mobile/MobileNav";
import { StickyNavDiv } from "./StickyNav";
import StickyNavItemList from "./StickyNavItemList";

function parseNavItems(items: NavItem[]) {
  const itemsCopied = [...items];

  if (items.length < 6) {
    return {
      itemsBefore: itemsCopied.splice(0, itemsCopied.length - 1),
      itemsMore: [],
      itemsAfter: itemsCopied,
    };
  }

  return {
    itemsBefore: itemsCopied.splice(0, 3),
    itemsMore: itemsCopied.splice(0, itemsCopied.length - 1),
    itemsAfter: itemsCopied,
  };
}

export default function StickyNavItems({ items }: { items: NavItem[] }) {
  const { itemsBefore, itemsMore, itemsAfter } = parseNavItems(items);

  return (
    <div className={"absolute flex w-full px-4 lg:px-16"}>
      <StickyNavDiv className="bg-white  w-full flex text-branding-dark justify-between uppercase font-medium text-sm tracking-widest rounded-full">
        <Link href="/" className="flex shrink-0">
          <Logo className="h-24 p-2 w-24 text-white" />
          <Hero className="h-24" />
        </Link>
        <div className="lg:hidden flex items-center pr-8">
          <MobileNavButton />
        </div>
        <ul className="hidden w-full items-center justify-end gap-x-12 gap-y-2 lg:flex pr-8">
          <StickyNavItemList items={itemsBefore} />
          <StickyNavItemList itemsMore={itemsMore} items={itemsAfter} />
        </ul>
      </StickyNavDiv>
    </div>
  );
}
