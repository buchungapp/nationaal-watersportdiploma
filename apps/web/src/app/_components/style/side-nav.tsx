"use client";

import clsx from "clsx";
import Link from "next/link";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useSearchParams, useSelectedLayoutSegment } from "next/navigation";
import React, { Suspense } from "react";
import { twMerge } from "tailwind-merge";

interface SideNavProps {
  label: string;
  items: {
    isActive?: (ctx: {
      selectedLayoutSegment: string | null;
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
  }[];
  className?: string;
  shouldScroll?: boolean;
}

function SideNavInner({
  label,
  items,
  className,
  shouldScroll = true,
  searchParams,
}: SideNavProps & { searchParams: ReadonlyURLSearchParams }) {
  const segment = useSelectedLayoutSegment();

  return (
    <div
      className={twMerge(
        "flex flex-col gap-2 text-sm sticky h-fit top-[160px]",
        className,
      )}
    >
      <div className="pl-4 text-sm font-semibold">{label}</div>
      <ul className="flex flex-col gap-3">
        {items.map(({ href: _href, label: _label, isActive: _isActive }) => {
          const isActive = _isActive
            ? _isActive({
                selectedLayoutSegment: segment,
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

          return (
            <li key={href}>
              <Link
                href={href}
                scroll={shouldScroll}
                className={clsx(
                  "block rounded-lg px-4 py-1.5 text-branding-dark transition-colors",
                  isActive
                    ? "bg-branding-dark/10 font-semibold"
                    : "hover:bg-gray-100",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
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
