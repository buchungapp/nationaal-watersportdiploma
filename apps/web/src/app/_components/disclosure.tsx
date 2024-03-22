"use client";

import { Disclosure as HeadlessDisclosure } from "@headlessui/react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import type { PropsWithChildren } from "react";
import React from "react";

export default function Disclosure({
  button,
  children,
}: PropsWithChildren<{ button: React.ReactNode }>) {
  return (
    <HeadlessDisclosure as="div" className="pt-6">
      {({ open }) => (
        <>
          <HeadlessDisclosure.Button className="">
            {button}
            <span className="ml-6 flex h-7 items-center">
              {open ? (
                <MinusIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <PlusIcon className="h-6 w-6" aria-hidden="true" />
              )}
            </span>
          </HeadlessDisclosure.Button>
          <HeadlessDisclosure.Panel as={React.Fragment}>
            {children}
          </HeadlessDisclosure.Panel>
        </>
      )}
    </HeadlessDisclosure>
  );
}
