import clsx from "clsx";
import Link from "next/link";
import MediaKit from "./media-kit";
import MobileDisclosure from "./mobile/mobile-disclosure";
import MobileItem from "./mobile/mobile-item";
import MobileNav, { MobileNavButton } from "./mobile/mobile-nav";
import ActiveHover from "./sticky/active-hover";
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
      active?: never;
    }
  | {
      label: string;
      component: {
        label: string;
        href: string;
        description?: string;
      }[];
      href?: never;
      active: string;
    };

export default function Nav({ items }: { items: NavItem[] }) {
  return (
    <>
      <MobileNav>
        <ul className="flex flex-1 flex-col px-4 py-2.5 gap-6">
          <li>
            <ul className="-mx-2 space-y-1">
              <li>
                <Link
                  href="/login"
                  className="group flex gap-x-3 rounded-lg p-2 text-sm leading-6 font-semibold text-branding-dark"
                >
                  Jouw account
                </Link>
              </li>
              {items.map((item) => (
                <li key={item.label}>
                  {!item.component ? (
                    <MobileItem item={item} />
                  ) : (
                    <MobileDisclosure item={item} />
                  )}
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </MobileNav>
      <StickyNavContainer className="flex w-full px-4 lg:px-16">
        <StickyNavDiv className="flex w-full justify-between rounded-full bg-white font-medium text-branding-dark">
          <MediaKit />
          <div className="flex items-center pr-8 lg:hidden">
            <MobileNavButton />
          </div>
          <StickyNavItemsContainer className="hidden pr-[48px] lg:flex lg:items-center lg:justify-end lg:gap-x-10">
            {items.map((item) =>
              "component" in item ? (
                <PopoverNavItem
                  key={item.label}
                  label={item.label}
                  active={item.active}
                >
                  <div className="p-4">
                    {item.component?.map((item) => (
                      <div
                        key={item.label}
                        className="group relative flex gap-x-6 rounded-lg p-4 text-sm leading-6 hover:bg-slate-50"
                      >
                        {/* <div className="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-slate-50 group-hover:bg-white">
                        <item.icon className="size-6 text-slate-600 group-hover:text-indigo-600" aria-hidden="true" />
                      </div> */}
                        <div className="flex-auto">
                          <Link
                            href={item.href}
                            className={clsx(
                              "block font-semibold",
                              item.href === "/cashback"
                                ? "text-branding-orange"
                                : "text-slate-900",
                            )}
                          >
                            {item.label}
                            <span className="absolute inset-0" />
                          </Link>
                          {item.description ? (
                            <p className="mt-1 font-normal text-slate-600">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverNavItem>
              ) : (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={clsx(
                      "group relative flex flex-nowrap gap-1 py-0.5 text-sm uppercase",
                      item.href === "/cashback"
                        ? "text-branding-orange font-semibold"
                        : "",
                    )}
                  >
                    {item.label}
                    <ActiveHover active={item.href} />
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
