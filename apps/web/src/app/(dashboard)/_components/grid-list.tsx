import Link from "next/link";
import type { PropsWithChildren } from "react";
import type React from "react";

export function GridList({ children }: PropsWithChildren) {
  return (
    <ul className="grid grid-cols-1 gap-x-4 gap-y-4 lg:grid-cols-2 xl:gap-x-6">
      {children}
    </ul>
  );
}

export function GridListItem({ children }: PropsWithChildren) {
  return (
    <li className="overflow-hidden rounded-xl border border-slate-200">
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
      className="flex items-center gap-x-4 border-b border-slate-900/5 bg-branding-light/10 p-6"
    >
      {children}
    </Link>
  );
}
