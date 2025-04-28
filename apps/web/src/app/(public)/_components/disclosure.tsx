"use client";

import {
  Disclosure as HeadlessDisclosure,
  DisclosureButton as HeadlessDisclosureButton,
  DisclosurePanel as HeadlessDisclosurePanel,
} from "@headlessui/react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import type { PropsWithChildren } from "react";
import type React from "react";

export default function Disclosure({
  button,
  children,
  size = "base",
}: PropsWithChildren<{
  button: React.ReactNode;
  size?: "base" | "sm" | "xs" | "lg";
}>) {
  const buttonSize = {
    base: "size-6",
    sm: "size-5",
    xs: "size-4",
    lg: "size-8",
  }[size];

  return (
    <HeadlessDisclosure as="div" className="pt-6 w-full">
      {({ open }) => (
        <>
          <HeadlessDisclosureButton className="w-full flex items-center justify-between">
            {button}
            <span className="ml-6 flex h-7 items-center">
              {open ? (
                <MinusIcon className={buttonSize} aria-hidden="true" />
              ) : (
                <PlusIcon className={buttonSize} aria-hidden="true" />
              )}
            </span>
          </HeadlessDisclosureButton>
          <HeadlessDisclosurePanel unmount={false} as="div">
            {children}
          </HeadlessDisclosurePanel>
        </>
      )}
    </HeadlessDisclosure>
  );
}
