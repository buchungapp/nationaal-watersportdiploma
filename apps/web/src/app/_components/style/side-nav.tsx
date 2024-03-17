"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { twMerge } from "tailwind-merge";

export default function SideNav({
  label,
  items,
  className,
}: {
  label: string;
  items: { label: string; href: string }[];
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsList = Array.from(searchParams.entries());

  return (
    <div className={twMerge("flex flex-col gap-2 text-sm", className)}>
      <span className="ml-4 text-sm font-semibold">{label}</span>
      <ul className="flex flex-col gap-3">
        {items.map(({ href, label }) => {
          const url = new URL(href, "http://localhost");
          const currentPathname = url.pathname;
          const currentSearchParams = url.searchParams;
          const currentSearchParamsList = Array.from(
            currentSearchParams.entries(),
          );

          const matchesPathname = pathname === currentPathname;
          const matchesSearchParams = currentSearchParamsList.every(
            ([key, value]) =>
              searchParamsList.some(([k, v]) => k === key && v === value),
          );
          const isActive = matchesPathname && matchesSearchParams;

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
