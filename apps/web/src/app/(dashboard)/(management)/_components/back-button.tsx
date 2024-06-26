import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import Link from "next/link";
import type { ComponentProps, PropsWithChildren } from "react";

export default function ({
  href,
  children,
}: PropsWithChildren<{ href: ComponentProps<typeof Link>["href"] }>) {
  return (
    <div className="max-lg:hidden mb-4">
      <Link
        href={href}
        className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400"
      >
        <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
        {children}
      </Link>
    </div>
  );
}
