import * as Headless from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import type React from "react";

export function LayoutSingleCard({ children }: React.PropsWithChildren) {
  return (
    <div className="lg:bg-white dark:lg:bg-zinc-900 lg:shadow-xs p-6 lg:p-10 lg:rounded-lg lg:ring-1 lg:ring-zinc-950/5 dark:lg:ring-white/10 grow">
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}

export function LayoutMultiCard({ children }: React.PropsWithChildren) {
  return (
    <div className="lg:p-2 grow">
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}

export function LayoutCard({
  children,
  className,
  transparent,
}: React.PropsWithChildren<{ className?: string; transparent?: boolean }>) {
  return (
    <div
      className={clsx(
        transparent ? "sm:px-5 sm:py-2 px-3 py-1" : "sm:p-5 p-3",
        !transparent &&
          "bg-white dark:bg-zinc-900 shadow-xs rounded-lg ring-1 ring-zinc-950/5 dark:ring-white/10",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function LayoutMobilePadding({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx("max-sm:px-3 max-lg:px-5", className)}>{children}</div>
  );
}

export function LayoutCardDisclosure({
  children,
  className,
  transparent,
  header,
  ...props
}: React.PropsWithChildren<{
  className?: string;
  transparent?: boolean;
  header: React.ReactNode;
}> &
  Headless.DisclosureProps) {
  return (
    <div
      className={clsx(
        transparent ? "sm:px-5 sm:py-2 px-3 py-1" : "sm:p-5 p-3",
        !transparent &&
          "bg-white dark:bg-zinc-900 shadow-xs rounded-lg ring-1 ring-zinc-950/5 dark:ring-white/10",
        className,
      )}
    >
      <Headless.Disclosure {...props}>
        <Headless.DisclosureButton className="group/stacked-layout-card-disclosure relative focus:outline-none w-full text-left">
          <span className="absolute inset-0 rounded-lg group-data-focus/stacked-layout-card-disclosure:outline-2 group-data-focus/stacked-layout-card-disclosure:outline-branding-light group-data-focus/stacked-layout-card-disclosure:outline-offset-2" />
          {header}
        </Headless.DisclosureButton>
        <Headless.DisclosurePanel>{children}</Headless.DisclosurePanel>
      </Headless.Disclosure>
    </div>
  );
}

export function LayoutCardDisclosureChevron() {
  return (
    <ChevronDownIcon className="size-4 group-data-open/stacked-layout-card-disclosure:rotate-180 transition" />
  );
}
