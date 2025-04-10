"use client";

import { Popover } from "@headlessui/react";
import clsx from "clsx";
import type { PropsWithChildren } from "react";

import { useIsSticky } from "~/app/_components/providers";

export function StickyNavContainer({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  const isSticky = useIsSticky();

  return (
    <>
      <nav className={clsx(isSticky && "fixed top-4 z-30", "", className)}>
        {children}
      </nav>
      {/* Component that replaces the height of the sticky nav when it becomes sticky */}
      <div className={clsx(isSticky ? "h-24" : "hidden")} />
    </>
  );
}

export function StickyNavDiv({
  children,
  className,
}: PropsWithChildren<{
  className?: string;
}>) {
  const isSticky = useIsSticky();

  return (
    <div className={clsx(isSticky && "shadow-sm", className)}>{children}</div>
  );
}

export function StickyNavItemsContainer({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <Popover.Group as="ul" className={className}>
      {children}
    </Popover.Group>
  );
}
