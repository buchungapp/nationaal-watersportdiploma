"use client";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import type React from "react";

import { useMobileMenuState } from "~/app/_components/providers";

export default function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useMobileMenuState();

  return (
    <Dialog open={open} onClose={setOpen} className="relative z-40 lg:hidden">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/25 transition-opacity duration-300 ease-linear data-closed:opacity-0"
      />

      <div className="fixed inset-0 z-40 flex justify-end">
        <DialogPanel
          transition
          className="relative flex w-full max-w-xs transform flex-col overflow-y-auto bg-white pb-12 shadow-xl transition duration-300 ease-in-out data-closed:translate-x-full"
        >
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
              <XMarkIcon className="size-6" aria-hidden="true" />
            </button>
          </div>
          <div className="overflow-y-auto">{children}</div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export function MobileNavButton() {
  const [, setOpen] = useMobileMenuState();

  return (
    <button type="button" onClick={() => setOpen(true)}>
      <Bars3Icon className="size-7" />
    </button>
  );
}
