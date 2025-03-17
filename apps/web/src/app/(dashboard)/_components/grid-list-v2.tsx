import { EllipsisVerticalIcon } from "@heroicons/react/16/solid";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import type React from "react";
import { Dropdown, DropdownButton, DropdownMenu } from "./dropdown";

export const gridContainer = "@container/grid-list";

export function GridList({ children }: PropsWithChildren) {
  return (
    <ul className="gap-x-4 gap-y-4 xl:gap-x-6 grid grid-cols-1 @xl/grid-list:grid-cols-2 @4xl/grid-list:grid-cols-3">
      {children}
    </ul>
  );
}

export function GridListItem({ children }: PropsWithChildren) {
  return (
    <li className="py-3 border border-slate-200 rounded-xl overflow-hidden">
      {children}
    </li>
  );
}

export function GridListItemHeader({ children }: PropsWithChildren) {
  return (
    <div className="flex justify-between items-center gap-x-4 px-6 pt-3 pb-3">
      {children}
    </div>
  );
}

const gridListItemTitleClassNames =
  "text-sm font-medium leading-6 text-slate-900";
export function GridListItemTitle({
  children,
  ...linkProps
}:
  | Omit<React.ComponentPropsWithoutRef<typeof Link>, "className">
  | Omit<React.ComponentPropsWithRef<"h3">, "className">) {
  if ("href" in linkProps) {
    return (
      <Link {...linkProps}>
        <h3 className={gridListItemTitleClassNames}>{children}</h3>
      </Link>
    );
  }

  return (
    <h3 {...linkProps} className={gridListItemTitleClassNames}>
      {children}
    </h3>
  );
}

export function GirdListItemOptions({ children }: PropsWithChildren) {
  return (
    <Dropdown>
      <DropdownButton plain className="-my-1.5">
        <EllipsisVerticalIcon />
      </DropdownButton>
      <DropdownMenu anchor="bottom end">{children}</DropdownMenu>
    </Dropdown>
  );
}
