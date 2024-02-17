"use client";

import { Dialog } from "@headlessui/react";
import React, { PropsWithChildren } from "react";
// Create a React context to store the current navigation state
export const MenuContext = React.createContext<NavigationState | null>(null);

// Create a custom hook to access the navigation context
export function useMenu() {
  const menu = React.useContext(MenuContext);
  if (!menu) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return menu;
}

// Define the menu state (isOpen, setIsOpen)
export interface NavigationState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// Define the menu provider
export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const value = { isOpen, setIsOpen };
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

// Define the menu component

export function Menu({ children }: PropsWithChildren) {
  const { isOpen, setIsOpen } = useMenu();
  return (
    <Dialog as="div" className="lg:hidden" open={isOpen} onClose={setIsOpen}>
      <div className="fixed inset-0 z-10" />
      <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
        <div className="flex items-center justify-between">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">Your Company</span>
            <img
              className="h-8 w-auto"
              src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
              alt=""
            />
          </a>
          <button
            type="button"
            className="-m-2.5 rounded-md p-2.5 text-gray-700"
            onClick={() => setIsOpen(false)}
          >
            <span className="sr-only">Close menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-6 flow-root">
          <div className="-my-6 divide-y divide-gray-500/10">{children}</div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
