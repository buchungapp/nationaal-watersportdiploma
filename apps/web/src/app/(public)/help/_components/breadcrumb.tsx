import { ChevronRightIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import Link from "next/link";
import { Fragment } from "react";

export default function Breadcrumb({
  items,
}: {
  items: { label: string; href: string }[];
}) {
  return (
    <div className="flex items-center w-full overflow-hidden">
      {items.map((item, index) => (
        <Fragment key={item.href}>
          <Link
            href={item.href}
            className={clsx(
              "group flex gap-1 shrink-0 justify-between rounded-lg px-4 py-2 text-sm font-semibold transition-colors text-branding-dark hover:bg-branding-dark/10",
            )}
          >
            {item.label}
          </Link>
          {index < items.length - 1 && (
            <ChevronRightIcon className="h-5 w-5 shrink-0 text-gray-500" />
          )}
        </Fragment>
      ))}
    </div>
  );
}
