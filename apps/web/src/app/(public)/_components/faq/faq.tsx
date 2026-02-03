"use client";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import type React from "react";
import type { PropsWithChildren } from "react";

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
        <DisclosureButton
          className="flex p-4 hover:bg-slate-100 w-full items-start justify-start text-left"
          data-attr="faq"
        >
          <div className="mr-6 flex h-6 items-center justify-center">
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 transition-transform ui-open:rotate-90" />
          </div>
          <span className="font-semibold leading-6">{question}</span>
        </DisclosureButton>
      </dt>
      <DisclosurePanel
        unmount={false}
        as="dd"
        className="mt-2 pl-14 pr-4 pb-4 leading-relaxed"
      >
        {children}
      </DisclosurePanel>
    </Disclosure>
  );
}
