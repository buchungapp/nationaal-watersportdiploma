"use client";

import { Disclosure } from "@headlessui/react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useSelectedLayoutSegment } from "next/navigation";
import type { NavItem } from "../nav";

export default function MobileDisclosure({ item }: { item: NavItem }) {
  const segment = useSelectedLayoutSegment();

  if (!item.component) return null;

  return (
    <Disclosure as="div">
      {({ open }) => (
        <>
          <Disclosure.Button
            className={clsx(
              item.active && segment && item.active.includes(segment)
                ? "bg-branding-dark/10"
                : open
                  ? "bg-gray-100"
                  : "hover:bg-gray-100",
              "flex items-center w-full text-left rounded-lg p-2 gap-x-3 text-sm leading-6 font-semibold text-branding-dark",
            )}
          >
            {item.label}
            <ChevronRightIcon
              className={clsx(
                open && "rotate-90",
                "transition-transform ml-auto h-5 w-5 shrink-0",
              )}
              aria-hidden="true"
            />
          </Disclosure.Button>
          <Disclosure.Panel as="ul" className="mt-1 px-2">
            {item.component}
            {/* 
                            {item.children.map((subItem) => (
                              <li key={subItem.name}>
                                <Disclosure.Button
                                  as="a"
                                  href={subItem.href}
                                  className={clsx(
                                    subItem.current
                                      ? "bg-gray-50"
                                      : "hover:bg-gray-50",
                                    "block rounded-md py-2 pr-2 pl-9 text-sm leading-6 text-gray-700",
                                  )}
                                >
                                  {subItem.name}
                                </Disclosure.Button>
                              </li>
                            ))} */}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
