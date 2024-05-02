"use client";

import {
  AcademicCapIcon,
  RectangleStackIcon,
  UserGroupIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";
import { useParams, useSelectedLayoutSegment } from "next/navigation";

export function LocationSidebarMenu() {
  const segment = useSelectedLayoutSegment();
  const params = useParams();

  return (
    <ul role="list" className="-mx-2 space-y-1">
      {[
        {
          name: "Cohorten",
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          href: `/${params.location}/cohorten`,
          icon: RectangleStackIcon,
          current: segment === "cohorten",
        },
        {
          name: "Personen",
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          href: `/${params.location}/personen`,
          icon: UserGroupIcon,
          current: segment === "personen",
        },
        {
          name: "Diploma's",
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          href: `/${params.location}/diplomas`,
          icon: AcademicCapIcon,
          current: segment === "diplomas",
        },
      ].map((item) => (
        <li key={item.name}>
          <a
            href={item.href}
            className={clsx(
              item.current
                ? "bg-gray-50 text-branding-dark"
                : "text-gray-700 hover:text-branding-dark hover:bg-gray-50",
              "group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold",
            )}
          >
            <item.icon
              className={clsx(
                item.current
                  ? "text-branding-dark"
                  : "text-gray-400 group-hover:text-branding-dark",
                "h-5 w-5 shrink-0",
              )}
              aria-hidden="true"
            />
            {item.name}
          </a>
        </li>
      ))}
    </ul>
  );
}
