"use client";

import { Popover, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { PropsWithChildren } from "react";
import { Fragment } from "react";

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
      <Popover.Button className="flex items-center gap-x-1 text-sm font-medium uppercase leading-6">
        {label}
        <ChevronDownIcon className="h-5 w-5 flex-none" aria-hidden="true" />
        <ActiveHover active={active} />
      </Popover.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute -left-8 top-full z-10 mt-3 w-screen max-w-md overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-gray-900/5">
          {children}
        </Popover.Panel>
      </Transition>
    </Popover>
  );
}
