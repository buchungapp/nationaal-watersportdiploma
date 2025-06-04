import * as Headless from "@headlessui/react";
import {
  ChevronDownIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/16/solid";
import clsx from "clsx";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import type React from "react";
import { Dropdown, DropdownButton, DropdownMenu } from "./dropdown";

export const gridContainer = "@container/grid-list";

export function GridList({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <ul className={clsx("gap-2 grid grid-cols-1", className)}>{children}</ul>
  );
}

export function GridListItem({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <li
      className={clsx(
        "py-3 border border-slate-200 rounded-xl overflow-hidden",
        className,
      )}
    >
      {children}
    </li>
  );
}

export function GridListItemHeader({ children }: PropsWithChildren) {
  return (
    <div className="flex justify-between items-center gap-x-4 px-4 py-1.5">
      {children}
    </div>
  );
}

export function GridListItemFooter({ children }: PropsWithChildren) {
  return (
    <div className="flex justify-between items-center gap-x-4 bg-branding-light/10 -mb-3 px-4 pt-3 pb-3 border-t border-t-slate-200">
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

export function GridListItemDisclosure({
  header,
  children,
  defaultOpen = false,
}: PropsWithChildren<{
  header: React.ReactNode;
  disabled?: boolean;
  defaultOpen: boolean;
}>) {
  return (
    <Headless.Disclosure as="div" defaultOpen={defaultOpen}>
      <Headless.DisclosureButton
        className={clsx(
          "group/progress-card-disclosure flex justify-between items-center gap-2 data-active:bg-zinc-100 data-hover:bg-zinc-50 data-disabled:opacity-50 py-2 sm:py-2.5 focus:outline-none w-[calc(100%+1rem)] sm:w-[calc(100%+2rem)] text-zinc-950 lg:text-sm text-base -mx-2 sm:-mx-4 px-2 sm:px-4",
        )}
      >
        <div className="flex items-center gap-2 font-medium">{header}</div>
        <ChevronDownIcon className="size-4 text-zinc-500 group-data-open/progress-card-disclosure:rotate-180 transition-transform" />
      </Headless.DisclosureButton>
      <Headless.DisclosurePanel className="pb-4">
        {children}
      </Headless.DisclosurePanel>
    </Headless.Disclosure>
  );
}
