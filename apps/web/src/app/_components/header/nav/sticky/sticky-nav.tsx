"use client";

import { PropsWithChildren } from "react";

import clsx from "clsx";

import { Popover } from "@headlessui/react";
import { useIsSticky } from "~/app/providers";

export function StickyNavContainer({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  const isSticky = useIsSticky();

  return (
    <>
      <nav className={clsx(isSticky && "top-4 fixed z-30", "", className)}>{children}</nav>
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

  return <div className={clsx(isSticky && "shadow", className)}>{children}</div>;
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
