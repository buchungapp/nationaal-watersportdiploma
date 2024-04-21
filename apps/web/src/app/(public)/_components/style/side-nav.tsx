"use client";

import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useSearchParams, useSelectedLayoutSegments } from "next/navigation";
import React, { Fragment, Suspense } from "react";
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
    computedSections.length == 1 ? computedSections[0]!.label : null;

  return (
    <>
      <Menu
        as="div"
        className="relative inline-block sm:hidden text-left w-full"
      >
        <div>
          <Menu.Button className="inline-flex w-full truncate justify-between rounded-xl bg-branding-dark/10 px-4 py-2 text-sm font-medium text-branding-dark group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
            {active.length == 1 && typeof active[0]!.label === "string"
              ? active[0]!.label
              : label ?? "Menu"}
            <ChevronDownIcon
              className="-mr-1 ml-2 h-5 w-5 group-hover:translate-y-0.5 transition-transform"
              aria-hidden="true"
            />
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-2 text-sm px-2 py-2.5 w-full gap-6 flex flex-col origin-top rounded-xl bg-white shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
            {computedSections.map(({ items, label }) => {
              return (
                <div key={`${label}`} className="flex flex-col gap-2">
                  {label ? (
                    <div className="pl-4 text-sm font-semibold">{label}</div>
                  ) : null}
                  <ul className="flex flex-col gap-3">
                    {items.map(({ href, label, isActive, scroll }) => (
                      <li key={href}>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href={href}
                              scroll={scroll ?? true}
                              className={clsx(
                                "block rounded-lg px-4 py-1.5 text-branding-dark transition-colors tabular-nums",
                                isActive
                                  ? "bg-branding-dark/10 font-semibold"
                                  : active && "bg-gray-100",
                              )}
                            >
                              {label}
                            </Link>
                          )}
                        </Menu.Item>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </Menu.Items>
        </Transition>
      </Menu>
      <div
        className={twMerge(
          "text-sm sticky h-fit top-[160px] hidden sm:flex flex-col gap-y-12",
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
                          : "hover:bg-gray-100",
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
