"use client";

import { PropsWithChildren } from "react";

import clsx from "clsx";

import { useIsSticky } from "~/app/providers";

export default function StickyNav({ children }: PropsWithChildren) {
  const isSticky = useIsSticky();

  return (
    <div className={"relative"}>
      <nav className={clsx(isSticky && "fixed top-0 z-40", "w-full")}>{children}</nav>
    </div>
  );
}

export function StickyNavDiv({
  children,
  className,
}: PropsWithChildren<{
  className?: string;
}>) {
  const isSticky = useIsSticky();

  return <div className={clsx(isSticky && "shadow mt-4", className)}>{children}</div>;
}
