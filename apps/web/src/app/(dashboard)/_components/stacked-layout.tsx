"use client";

import * as Headless from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import type React from "react";
import { useState } from "react";
import { NavbarItem } from "./navbar";

function OpenMenuIcon() {
  return (
    <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M2 6.75C2 6.33579 2.33579 6 2.75 6H17.25C17.6642 6 18 6.33579 18 6.75C18 7.16421 17.6642 7.5 17.25 7.5H2.75C2.33579 7.5 2 7.16421 2 6.75ZM2 13.25C2 12.8358 2.33579 12.5 2.75 12.5H17.25C17.6642 12.5 18 12.8358 18 13.25C18 13.6642 17.6642 14 17.25 14H2.75C2.33579 14 2 13.6642 2 13.25Z" />
    </svg>
  );
}

function CloseMenuIcon() {
  return (
    <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}

function MobileSidebar({
  open,
  close,
  children,
}: React.PropsWithChildren<{ open: boolean; close: () => void }>) {
  return (
    <Headless.Dialog open={open} onClose={close} className="lg:hidden">
      <Headless.DialogBackdrop
        transition
        className="fixed inset-0 bg-black/30 data-closed:opacity-0 transition data-enter:duration-300 data-leave:duration-200 data-leave:ease-in data-enter:ease-out"
      />
      <Headless.DialogPanel
        transition
        className="fixed inset-y-0 p-2 w-full max-w-80 transition data-closed:-translate-x-full duration-300 ease-in-out"
      >
        <div className="flex flex-col bg-white dark:bg-zinc-900 shadow-xs rounded-lg ring-1 ring-zinc-950/5 dark:ring-white/10 h-full">
          <div className="-mb-3 px-4 pt-3">
            <Headless.CloseButton as={NavbarItem} aria-label="Close navigation">
              <CloseMenuIcon />
            </Headless.CloseButton>
          </div>
          {children}
        </div>
      </Headless.DialogPanel>
    </Headless.Dialog>
  );
}

export function StackedLayout({
  navbar,
  sidebar,
  children,
}: React.PropsWithChildren<{
  navbar: React.ReactNode;
  sidebar: React.ReactNode;
}>) {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="isolate relative flex flex-col bg-zinc-100 dark:bg-zinc-900 dark:lg:bg-zinc-950 w-full min-h-svh">
      {/* Sidebar on mobile */}
      {!!sidebar && (
        <MobileSidebar open={showSidebar} close={() => setShowSidebar(false)}>
          {sidebar}
        </MobileSidebar>
      )}

      {/* Navbar */}
      <header className="flex items-center px-4">
        {!!sidebar && (
          <div className="lg:hidden py-2.5">
            <NavbarItem
              onClick={() => setShowSidebar(true)}
              aria-label="Open navigation"
            >
              <OpenMenuIcon />
            </NavbarItem>
          </div>
        )}
        <div className="flex-1 min-w-0">{navbar}</div>
      </header>

      {/* Content */}
      <main className="flex flex-col flex-1 lg:px-2 pb-2">
        {/* <div className="lg:bg-white dark:lg:bg-zinc-900 lg:shadow-xs p-6 lg:p-10 lg:rounded-lg lg:ring-1 lg:ring-zinc-950/5 dark:lg:ring-white/10 grow"> */}
        <div className="p-2 lg:p-10 grow">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
        {/* </div> */}
      </main>
    </div>
  );
}

export function StackedLayoutCard({
  children,
  className,
  transparent,
}: React.PropsWithChildren<{ className?: string; transparent?: boolean }>) {
  return (
    <div
      className={clsx(
        transparent ? "sm:px-5 sm:py-2 px-3 py-1" : "sm:p-5 p-3",
        !transparent &&
          "bg-white dark:bg-zinc-900 shadow-xs rounded-lg ring-1 ring-zinc-950/5 dark:ring-white/10",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StackedLayoutCardDisclosure({
  children,
  className,
  transparent,
  header,
  ...props
}: React.PropsWithChildren<{
  className?: string;
  transparent?: boolean;
  header: React.ReactNode;
}> &
  Headless.DisclosureProps) {
  return (
    <div
      className={clsx(
        transparent ? "sm:px-5 sm:py-2 px-3 py-1" : "sm:p-5 p-3",
        !transparent &&
          "bg-white dark:bg-zinc-900 shadow-xs rounded-lg ring-1 ring-zinc-950/5 dark:ring-white/10",
        className,
      )}
    >
      <Headless.Disclosure {...props}>
        <Headless.DisclosureButton className="group/stacked-layout-card-disclosure relative focus:outline-none w-full text-left">
          <span className="absolute inset-0 rounded-lg group-data-focus/stacked-layout-card-disclosure:outline-2 group-data-focus/stacked-layout-card-disclosure:outline-branding-light group-data-focus/stacked-layout-card-disclosure:outline-offset-2" />
          {header}
        </Headless.DisclosureButton>
        <Headless.DisclosurePanel>{children}</Headless.DisclosurePanel>
      </Headless.Disclosure>
    </div>
  );
}

export function StackedLayoutCardDisclosureChevron() {
  return (
    <ChevronDownIcon className="size-4 group-data-open/stacked-layout-card-disclosure:rotate-180 transition" />
  );
}
