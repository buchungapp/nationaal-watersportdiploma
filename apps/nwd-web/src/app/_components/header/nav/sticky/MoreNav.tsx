"use client";

import { Fragment } from "react";

import { Menu, Transition } from "@headlessui/react";
import clsx from "clsx";
import Link from "next/link";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Double from "~/app/_assets/Double";
import { type NavItem } from "../Nav";

export default function MoreNav({ items, label }: { items: NavItem[]; label: string }) {
  return (
    <Menu as="div" className="relative inline-block">
      {({ open }) => (
        <>
          <Menu.Button
            className={
              "relative z-10 flex flex-nowrap tracking-widest items-center gap-1 py-0.5 uppercase group"
            }
          >
            <span>{label}</span>
            <ChevronDownIcon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            <Double
              className={clsx(
                "bottom-0 translate-y-full absolute transition-width text-branding-dark",
                open ? "w-full" : "group-hover:w-full w-0",
              )}
            />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Menu.Items
              className={clsx(
                "absolute w-96 left-1/2 z-10 mt-12  origin-top rounded-3xl -translate-x-1/2 overflow-hidden bg-white p-4 shadow-lg",
              )}
            >
              {items.map((item) => (
                <Menu.Item key={item.label}>
                  {({ active }) => {
                    return (
                      <Link
                        href={item.href}
                        className={clsx(
                          "relative block p-4 transition-colors rounded-xl",
                          active ? "bg-slate-100" : "",
                        )}
                      >
                        <div className="flex flex-nowrap gap-1 font-semibold text-branding-dark tracking-widest">
                          {item.icon}
                          {item.label}
                        </div>
                        <p className="mt-1 font-normal normal-case text-branding">
                          {item.description}
                        </p>
                      </Link>
                    );
                  }}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
}
