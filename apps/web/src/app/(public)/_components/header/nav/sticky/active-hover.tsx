"use client";

import clsx from "clsx";
import { useSelectedLayoutSegment } from "next/navigation";
import Double from "~/app/_components/brand/double-line";

export default function ActiveHover({ active }: { active?: string }) {
  const segment = useSelectedLayoutSegment();

  return (
    <Double
      className={clsx(
        "absolute bottom-0 w-0 translate-y-full text-branding-dark transition-width",
        active && segment && active.includes(segment)
          ? "w-full"
          : "group-hover:w-full ui-open:w-full",
      )}
    />
  );
}
