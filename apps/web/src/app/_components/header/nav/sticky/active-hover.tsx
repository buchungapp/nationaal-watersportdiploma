"use client";

import clsx from "clsx";
import { usePathname } from "next/navigation";
import Double from "~/app/_components/brand/double-line";

export default function ActiveHover({ active }: { active?: string }) {
  const pathname = usePathname();

  return (
    <Double
      className={clsx(
        "absolute bottom-0 w-0 translate-y-full text-branding-dark transition-width",
        active && pathname.startsWith(active)
          ? "w-full"
          : "group-hover:w-full ui-open:w-full",
      )}
    />
  );
}
