"use client";

import clsx from "clsx";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useMobileMenuState } from "~/app/_components/providers";
import type { NavItem } from "../nav";

export default function MobileItem({ item }: { item: NavItem }) {
  const segment = useSelectedLayoutSegment();
  const [, setOpen] = useMobileMenuState();

  if (!item.href) return null;

  return (
    <Link
      href={item.href}
      onClick={() => setOpen(false)}
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
