"use client";

import { Fragment, PropsWithChildren } from "react";

import { Popover, Transition } from "@headlessui/react";
import clsx from "clsx";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Double from "~/app/_components/brand/double-line";

export default function PopoverNavItem({
  children,
  label,
}: PropsWithChildren<{
  label: string;
}>) {
  return (
    <Popover className="relative">
      <Popover.Button className="flex uppercase items-center gap-x-1 text-sm font-medium leading-6">
        {label}
        <ChevronDownIcon className="h-5 w-5 flex-none" aria-hidden="true" />
        <Double
          className={clsx(
            "bottom-0 translate-y-full absolute transition-width text-branding-dark ui-open:w-full w-0 group-hover:w-full",
          )}
        />
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
