import clsx from "clsx";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import type React from "react";

export function GridList({ children }: PropsWithChildren) {
  return (
    <ul className="gap-x-4 gap-y-4 xl:gap-x-6 grid grid-cols-1 lg:grid-cols-2">
      {children}
    </ul>
  );
}

export function GridListItem({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <li
      className={clsx(
        "border border-slate-200 rounded-xl overflow-hidden",
        className,
      )}
    >
      {children}
    </li>
  );
}

export function GridListHeader({
  children,
  ...linkProps
}: PropsWithChildren<
  Omit<React.ComponentPropsWithoutRef<typeof Link>, "className">
>) {
  return (
    <Link
      {...linkProps}
      className="flex items-center gap-x-4 bg-branding-light/10 p-6 border-slate-900/5 border-b"
    >
      {children}
    </Link>
  );
}
