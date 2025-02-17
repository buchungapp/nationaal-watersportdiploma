"use client";
import clsx from "clsx";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import type { NavItem } from "../nav";

export default function MobileItem({ item }: { item: NavItem }) {
  const segment = useSelectedLayoutSegment();

  if (!item.href) return null;

  return (
    <Link
      href={item.href}
      className={clsx(
        segment && item.href.includes(segment)
          ? "bg-branding-dark/10"
          : "hover:bg-slate-100",
        "group flex gap-x-3 rounded-lg p-2 text-sm leading-6 font-semibold text-branding-dark",
      )}
    >
      {item.label}
    </Link>
  );
}
