/* eslint-disable @typescript-eslint/restrict-template-expressions */
"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import { useParams, useSelectedLayoutSegments } from "next/navigation";

export function LayoutTabs() {
  const params = useParams();
  const segments = useSelectedLayoutSegments();

  return (
    <>
      <nav
        className="flex space-x-6 text-sm overflow-auto scrollbar-none"
        aria-label="Tabs"
      >
        {[
          {
            name: "Cursisten",
            href: `/locatie/${params.location}/cohorten/${params.cohort}`,
            current: segments.length < 1,
          },
          {
            name: "Diploma's",
            href: `/locatie/${params.location}/cohorten/${params.cohort}/diplomas`,
            current: segments[0] === "diplomas",
          },
          {
            name: "Instructeurs",
            href: `/locatie/${params.location}/cohorten/${params.cohort}/instructeurs`,
            current: segments[0] === "instructeurs",
          },
          {
            name: "Instellingen",
            href: `/locatie/${params.location}/cohorten/${params.cohort}/instellingen`,
            current: segments[0] === "instellingen",
          },
        ].map((tab) => (
          <NextLink
            key={tab.name}
            href={tab.href}
            className={clsx(
              tab.current
                ? "bg-gray-100 text-gray-700"
                : "text-gray-500 hover:text-gray-700",
              "rounded-md px-3 py-2 text-sm font-medium",
            )}
            aria-current={tab.current ? "page" : undefined}
          >
            {tab.name}
          </NextLink>
        ))}
      </nav>
    </>
  );
}
