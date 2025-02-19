"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useSearchParams, useSelectedLayoutSegments } from "next/navigation";
import type React from "react";
import { Suspense } from "react";
import { twMerge } from "tailwind-merge";

interface SideNavProps {
  sections: {
    label?: string;
    items: {
      isActive?: (ctx: {
        selectedLayoutSegments: string[];
        searchParams: ReadonlyURLSearchParams;
      }) => boolean;
      label:
        | React.ReactNode
        | ((ctx: {
            isActive: boolean;
            searchParams: ReadonlyURLSearchParams;
          }) => React.ReactNode);
      href:
        | string
        | ((ctx: {
            isActive: boolean;
            searchParams: ReadonlyURLSearchParams;
          }) => string);
      scroll?: boolean;
    }[];
  }[];
  className?: string;
}

function SideNavInner({
  sections,
  className,
  searchParams,
}: SideNavProps & { searchParams: ReadonlyURLSearchParams }) {
  const segments = useSelectedLayoutSegments();
  const computedSections = sections.map(({ items, label }) => ({
    label,
    items: items.map(
      ({ href: _href, label: _label, isActive: _isActive, ...item }) => {
        const isActive = _isActive
          ? _isActive({
              selectedLayoutSegments: segments,
              searchParams,
            })
          : false;

        const href =
          typeof _href === "function"
            ? _href({ isActive, searchParams })
            : _href;

        const label =
          typeof _label === "function"
            ? _label({ isActive, searchParams })
            : _label;

        return {
          href,
          label,
          isActive,
          ...item,
        };
      },
    ),
  }));

  const active = computedSections
    .flatMap(({ items }) => items)
    .filter(({ isActive }) => isActive);

  const label =
    computedSections.length === 1 ? computedSections[0]?.label : null;

  return (
    <>
      <Menu
        as="div"
        className="relative inline-block sm:hidden text-left w-full"
      >
        <div>
          <MenuButton className="inline-flex w-full truncate justify-between rounded-xl bg-branding-dark/10 px-4 py-2 text-sm font-medium text-branding-dark group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white/75">
            {active.length === 1 && typeof active[0]?.label === "string"
              ? active[0]?.label
              : (label ?? "Menu")}
            <ChevronDownIcon
              className="-mr-1 ml-2 size-5 group-hover:translate-y-0.5 transition-transform"
              aria-hidden="true"
            />
          </MenuButton>
        </div>
        <MenuItems
          transition
          anchor="bottom"
          className={clsx(
            className,
            // Anchor positioning
            "[--anchor-gap:--spacing(2)] [--anchor-padding:--spacing(1)] data-[anchor~=start]:[--anchor-offset:-6px] data-[anchor~=end]:[--anchor-offset:6px] sm:data-[anchor~=start]:[--anchor-offset:-4px] sm:data-[anchor~=end]:[--anchor-offset:4px]",
            // Base styles
            "isolate w-full rounded-xl p-1 space-y-6",
            // Invisible border that is only visible in `forced-colors` mode for accessibility purposes
            "outline outline-1 outline-transparent focus:outline-hidden",
            // Handle scrolling when menu won't fit in viewport
            "overflow-y-auto",
            // Popover background
            "bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75",
            // Shadows
            "shadow-lg ring-1 ring-zinc-950/10 dark:ring-inset dark:ring-white/10",
            // Transitions
            "transition data-closed:data-leave:opacity-0 data-leave:duration-100 data-leave:ease-in",
          )}
        >
          {computedSections.map(({ items, label }) => {
            return (
              <div key={`${label}`} className="flex flex-col gap-2">
                {label ? (
                  <div className="pl-4 text-sm font-semibold">{label}</div>
                ) : null}
                <ul className="flex flex-col">
                  {items.map(({ href, label, isActive, scroll }) => (
                    <li key={href}>
                      <MenuItem>
                        <Link
                          href={href}
                          scroll={scroll ?? true}
                          className={clsx(
                            // Base styles
                            "group cursor-default block rounded-lg px-3.5 py-2.5 focus:outline-hidden sm:px-3 sm:py-1.5 inset-x-0",

                            // Text styles
                            "text-left text-base/6 text-branding-dark sm:text-sm/6 forced-colors:text-[CanvasText]",

                            // Focus
                            "data-focus:bg-slate-100",

                            // Disabled state
                            "data-disabled:opacity-50",

                            // Forced colors mode
                            "forced-color-adjust-none forced-colors:data-focus:bg-[Highlight] forced-colors:data-focus:text-[HighlightText] forced-colors:data-focus:*:data-[slot=icon]:text-[HighlightText]",

                            isActive && "bg-branding-dark/10 font-semibold",
                          )}
                        >
                          {label}
                        </Link>
                      </MenuItem>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </MenuItems>
      </Menu>

      <div
        className={twMerge(
          "text-sm sticky h-fit top-[160px] hidden md:flex flex-col gap-y-12",
          className,
        )}
      >
        {computedSections.map(({ items, label }) => {
          return (
            <div key={`${label}`} className="flex flex-col gap-2">
              {label ? (
                <div className="pl-4 text-sm font-semibold">{label}</div>
              ) : null}
              <ul className="flex flex-col gap-3">
                {items.map(({ href, label, isActive, scroll }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      scroll={scroll ?? true}
                      className={clsx(
                        "block rounded-lg px-4 py-1.5 text-branding-dark transition-colors tabular-nums",
                        isActive
                          ? "bg-branding-dark/10 font-semibold"
                          : "hover:bg-slate-100",
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}

function SideNavWithRegularSearchParams(props: SideNavProps) {
  return <SideNavInner {...props} searchParams={useSearchParams()} />;
}

function SideNavWithFallbackSearchParams(props: SideNavProps) {
  return (
    <SideNavInner
      {...props}
      searchParams={new URLSearchParams() as ReadonlyURLSearchParams}
    />
  );
}

export default function SideNav(props: SideNavProps) {
  return (
    // https://nextjs.org/docs/app/api-reference/functions/use-search-params#static-rendering
    <Suspense fallback={<SideNavWithFallbackSearchParams {...props} />}>
      <SideNavWithRegularSearchParams {...props} />
    </Suspense>
  );
}
