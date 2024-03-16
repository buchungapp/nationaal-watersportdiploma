import Link from "next/link";

import Double from "~/app/_components/brand/double-line";
import Logo from "~/app/_components/brand/logo";
import Wordmark from "~/app/_components/brand/wordmark";
import MobileNav, { MobileNavButton } from "./mobile/mobile-nav";
import PopoverNavItem from "./sticky/popover-item";
import {
  StickyNavContainer,
  StickyNavDiv,
  StickyNavItemsContainer,
} from "./sticky/sticky-nav";

export type NavItem =
  | {
      label: string;
      href: string;
      component?: never;
    }
  | {
      label: string;
      component: React.ReactNode;
      href?: never;
    };

export default function Nav({ items }: { items: NavItem[] }) {
  return (
    <>
      <MobileNav>TODO!</MobileNav>
      <StickyNavContainer className="flex w-full px-4 lg:px-16">
        <StickyNavDiv className="flex w-full justify-between rounded-full bg-white font-medium text-branding-dark">
          <Link href="/" className="flex shrink-0">
            <Logo className="h-24 w-24 p-2 text-white" />
            <Wordmark className="block h-24 lg:hidden xl:block" />
          </Link>
          <div className="flex items-center pr-8 lg:hidden">
            <MobileNavButton />
          </div>
          <StickyNavItemsContainer className="hidden pr-[48px] lg:flex lg:items-center lg:justify-end lg:gap-x-12">
            {items.map((item) =>
              "component" in item ? (
                <PopoverNavItem key={item.label} label={item.label}>
                  {item.component}
                </PopoverNavItem>
              ) : (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group relative flex flex-nowrap gap-1 py-0.5 text-sm uppercase"
                  >
                    {item.label}
                    <Double className="absolute bottom-0 w-0 translate-y-full text-branding-dark transition-width group-hover:w-full" />
                  </Link>
                </li>
              ),
            )}
          </StickyNavItemsContainer>
        </StickyNavDiv>
      </StickyNavContainer>
    </>
  );
}
