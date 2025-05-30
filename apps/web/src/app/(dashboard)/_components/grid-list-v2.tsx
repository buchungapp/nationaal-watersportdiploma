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

export function GridList({ children }: PropsWithChildren) {
  return <ul className="gap-2 grid grid-cols-1">{children}</ul>;
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
  title,
  children,
  defaultOpen = false,
  className,
  panelClassName,
}: PropsWithChildren<{
  title: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  panelClassName?: string;
}>) {
  return (
    <div className={clsx("border-t border-t-slate-200", className)}>
      <Headless.Disclosure defaultOpen={defaultOpen}>
        <Headless.DisclosureButton className="group/disclosure relative flex justify-between items-center data-active:bg-slate-100 data-hover:bg-slate-50 data-disabled:opacity-50 px-6 py-2 focus:outline-none w-full text-left">
          <span className="absolute inset-0 mx-2 rounded-lg group-data-focus/disclosure:outline-2 group-data-focus/disclosure:outline-branding-light group-data-focus/disclosure:outline-offset-2" />
          <span className="font-semibold text-slate-900 text-sm">{title}</span>
          <ChevronDownIcon className="w-4 h-4 text-slate-900 ui-open:rotate-180 transition-transform" />
        </Headless.DisclosureButton>
        <Headless.DisclosurePanel className={panelClassName}>
          {children}
        </Headless.DisclosurePanel>
      </Headless.Disclosure>
    </div>
  );
}
