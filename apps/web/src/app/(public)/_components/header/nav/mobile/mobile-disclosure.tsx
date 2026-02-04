"use client";

import { Disclosure } from "@headlessui/react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useMobileMenuState } from "~/app/_components/providers";
import type { NavItem } from "../nav";

export default function MobileDisclosure({ item }: { item: NavItem }) {
  const segment = useSelectedLayoutSegment();
  const [_, setOpen] = useMobileMenuState();

  if (!item.component) return null;

  return (
    <Disclosure as="div">
      {({ open, close }) => (
        <>
          <Disclosure.Button
            className={clsx(
              item.active && segment && item.active.includes(segment)
                ? "bg-branding-dark/10"
                : open
                  ? "bg-slate-100"
                  : "hover:bg-slate-100",
              "flex items-center w-full text-left rounded-lg p-2 gap-x-3 text-sm leading-6 font-semibold text-branding-dark",
            )}
          >
            {item.label}
            <ChevronRightIcon
              className={clsx(
                open && "rotate-90",
                "transition-transform ml-auto size-5 shrink-0",
              )}
              aria-hidden="true"
            />
          </Disclosure.Button>
          <Disclosure.Panel as="ul" className="mt-1 px-2">
            {item.component.map((subItem) => (
              <li key={subItem.label}>
                <Link
                  href={subItem.href}
                  onClick={() => {
                    close();
                    setOpen(false);
                  }}
                  className={clsx(
                    "hover:bg-slate-50",
                    "block rounded-md py-2 px-2 text-sm leading-6 text-branding-dark font-semibold",
                  )}
                >
                  {subItem.label}
                </Link>
              </li>
            ))}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
