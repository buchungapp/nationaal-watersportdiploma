"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { twMerge } from "tailwind-merge";

export default function SideNav({
  label,
  items,
  className,
  clear,
  params = false,
}: {
  label: string;
  items: { label: string; href: string }[];
  className?: string;
  clear?: string;
  params?: boolean;
}) {
  const pathname = usePathname();

  let active: { active: boolean; href: string }[] = [];
  if (params) {
    const searchParams = useSearchParams();
    const searchParamsList = Array.from(searchParams.entries());
    active = items.map(({ href }) => {
      const url = new URL(href, "http://localhost");
      const currentPathname = url.pathname;
      const currentSearchParams = url.searchParams;
      const currentSearchParamsList = Array.from(currentSearchParams.entries());

      const matchesPathname = pathname === currentPathname;
      const matchesSearchParams = currentSearchParamsList.every(
        ([key, value]) =>
          searchParamsList.some(([k, v]) => k === key && v === value),
      );

      return { href, active: matchesPathname && matchesSearchParams };
    });
  } else {
    active = items.map(({ href }) => {
      const url = new URL(href, "http://localhost");
      const currentPathname = url.pathname;
      const matchesPathname = pathname === currentPathname;

      return { href, active: matchesPathname };
    });
  }

  return (
    <div className={twMerge("flex flex-col gap-2 text-sm", className)}>
      <div className="flex pl-4 justify-between gap-1">
        <span className="text-sm font-semibold">{label}</span>
        {clear && active.some((x) => x.active) ? (
          <Link
            href={clear}
            className={
              "block rounded-lg -my-1.5 px-4 py-1.5 text-branding-dark transition-colors hover:bg-gray-100"
            }
          >
            <XMarkIcon className="w-4 h-4" />
          </Link>
        ) : null}
      </div>
      <ul className="flex flex-col gap-3">
        {items.map(({ href, label }) => {
          const isActive = active.find((item) => item.href === href)?.active;

          return (
            <li key={href}>
              <Link
                href={href}
                className={clsx(
                  "block rounded-lg px-4 py-1.5 text-branding-dark transition-colors",
                  isActive ? "bg-gray-100 font-semibold" : "hover:bg-gray-100",
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
