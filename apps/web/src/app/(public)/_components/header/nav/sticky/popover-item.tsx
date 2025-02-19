"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { PropsWithChildren } from "react";

import ActiveHover from "./active-hover";

export default function PopoverNavItem({
  children,
  label,
  active,
}: PropsWithChildren<{
  label: string;
  active?: string;
}>) {
  return (
    <Popover className="group relative">
      <PopoverButton className="flex items-center gap-x-1 text-sm font-medium uppercase leading-6">
        {label}
        <ChevronDownIcon className="size-5 flex-none" aria-hidden="true" />
        <ActiveHover active={active} />
      </PopoverButton>
      <PopoverPanel
        transition
        className="absolute -translate-x-[9.5rem] -left-8 top-full z-10 mt-3 w-screen max-w-md overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-900/5 transition data-closed:opacity-0 data-enter:duration-200 data-leave:duration-150 data-enter:ease-out data-leave:ease-in"
      >
        {children}
      </PopoverPanel>
    </Popover>
  );
}
