"use client";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <div className={twMerge("flex flex-col gap-2 text-sm", className)}>
      <span className="font-semibold text-sm ml-4">{label}</span>
      <ul className="gap-3 flex flex-col">
        {items.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={clsx(
                "px-4 py-1.5 block transition-colors rounded-lg text-branding-dark",
                pathname === href ? "bg-slate-100 font-semibold" : "hover:bg-slate-100",
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
