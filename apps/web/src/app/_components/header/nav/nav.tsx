import Link from "next/link";

import Double from "~/app/_components/brand/double-line";
import Logo from "~/app/_components/brand/logo";
import Wordmark from "~/app/_components/brand/wordmark";

import MobileNav, { MobileNavButton } from "./mobile/mobile-nav";
import PopoverNavItem from "./sticky/popover-item";
import { StickyNavContainer, StickyNavDiv, StickyNavItemsContainer } from "./sticky/sticky-nav";

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
        <StickyNavDiv className="bg-white w-full flex text-branding-dark justify-between font-medium rounded-full">
          <Link href="/" className="flex shrink-0">
            <Logo className="h-24 p-2 w-24 text-white" />
            <Wordmark className="h-24 block lg:hidden xl:block" />
          </Link>
          <div className="lg:hidden flex items-center pr-8">
            <MobileNavButton />
          </div>
          <StickyNavItemsContainer className="hidden lg:items-center lg:justify-end lg:gap-x-12 lg:flex pr-[48px]">
            {items.map((item) =>
              "component" in item ? (
                <PopoverNavItem key={item.label} label={item.label}>
                  {item.component}
                </PopoverNavItem>
              ) : (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group relative uppercase flex text-sm flex-nowrap gap-1 py-0.5"
                  >
                    {item.label}
                    <Double className="bottom-0 translate-y-full absolute transition-width group-hover:w-full w-0 text-branding-dark" />
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
