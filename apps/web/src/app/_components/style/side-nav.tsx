"use client";

import clsx from "clsx";
import Link from "next/link";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useSearchParams, useSelectedLayoutSegments } from "next/navigation";
import React, { Suspense } from "react";
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

  return (
    <div
      className={twMerge(
        "text-sm sticky h-fit top-[160px] flex flex-col gap-y-12",
        className,
      )}
    >
      {sections.map(({ items, label }) => {
        return (
          <div key={`${label}`} className="flex flex-col gap-2">
            {label ? (
              <div className="pl-4 text-sm font-semibold">{label}</div>
            ) : null}
            <ul className="flex flex-col gap-3">
              {items.map(
                ({
                  href: _href,
                  label: _label,
                  isActive: _isActive,
                  scroll,
                }) => {
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

                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        scroll={scroll ?? true}
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
                },
              )}
            </ul>
          </div>
        );
      })}
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
