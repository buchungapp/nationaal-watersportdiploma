"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import React, { Fragment } from "react";

import { useMobileMenuState } from "~/app/providers";

export default function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useMobileMenuState();

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 z-40 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="relative ml-10 flex w-full max-w-sm flex-col bg-white shadow-xl">
              <div className="relative flex items-center justify-center bg-branding-light p-4">
                <Link href="/">
                  <Image
                    width={150}
                    height={130}
                    priority
                    src="/logo.svg"
                    alt="nationaal watersport diploma"
                  />
                </Link>

                <button
                  type="button"
                  className="absolute right-4 top-4 -m-2 inline-flex shrink-0 items-center justify-center rounded-md p-2 text-white"
                  onClick={() => setOpen(false)}
                >
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Sluit menu</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              {children}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export function MobileNavButton() {
  const [_, setOpen] = useMobileMenuState();

  return (
    <button onClick={() => setOpen(true)}>
      <Bars3Icon className="h-7 w-7" />
    </button>
  );
}
