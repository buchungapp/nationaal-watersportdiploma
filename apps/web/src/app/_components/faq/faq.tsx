"use client";

import type { PropsWithChildren } from "react";
import React from "react";

import { Disclosure } from "@headlessui/react";
import { ChevronRightIcon } from "@heroicons/react/24/solid";

export default function FaqDisclosure({
  question,
  children,
  className = "",
  defaultOpen = false,
}: PropsWithChildren<{
  question: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
}>) {
  return (
    <Disclosure as="div" className={className} defaultOpen={defaultOpen}>
      <dt>
        <Disclosure.Button className="flex p-4 hover:bg-gray-100 w-full items-start justify-start text-left">
          <div className="mr-6 flex h-6 items-center justify-center">
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 transition-transform ui-open:rotate-90" />
          </div>
          <span className="font-semibold leading-6">{question}</span>
        </Disclosure.Button>
      </dt>
      <Disclosure.Panel
        as="dd"
        className="mt-2 pl-14 pr-4 pb-4 leading-relaxed"
      >
        {children}
      </Disclosure.Panel>
    </Disclosure>
  );
}
