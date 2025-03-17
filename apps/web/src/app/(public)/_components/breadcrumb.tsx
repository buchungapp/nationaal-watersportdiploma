import { ChevronRightIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import Link from "next/link";

export default function Breadcrumb({
  items,
}: {
  items: { label: string; href: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="flex max-w-full not-prose">
      <ol className="flex items-center space-x-4 overflow-x-auto">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            <Link
              href={item.href}
              className={clsx(
                "mr-4 text-sm whitespace-nowrap font-medium text-branding-dark hover:text-branding-dark/10",
              )}
            >
              {item.label}
            </Link>
            {index < items.length - 1 && (
              <ChevronRightIcon
                className="size-5 shrink-0 text-slate-400"
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
