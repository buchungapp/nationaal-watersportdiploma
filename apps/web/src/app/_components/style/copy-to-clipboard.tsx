"use client";

import { Transition } from "@headlessui/react";
import { ComponentPropsWithoutRef, Fragment, useState } from "react";
import { twMerge } from "tailwind-merge";

export default function CopyToClipboard({
  children,
  value,
  className,
  ...props
}: ComponentPropsWithoutRef<"button"> & { value: string }) {
  const [showing, setShowing] = useState(false);
  return (
    <span className="relative">
      <button
        {...props}
        onClick={(e) => {
          if (typeof navigator.clipboard === "undefined") return;
          navigator.clipboard.writeText(value);
          props.onClick?.(e);

          setShowing(true);
          setTimeout(() => setShowing(false), 400);
        }}
        className={twMerge(
          "rounded-lg hover:-mx-2 hover:px-2 transition-[padding,margin,background-color] hover:bg-gray-100",
          className,
        )}
      >
        {children}
      </button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
        show={showing}
      >
        <span className="absolute left-1/2 z-10 top-0 -translate-y-full -mt-2 -translate-x-1/2">
          <span className="bg-branding-dark shadow-lg rounded-lg px-2 py-1">
            <span className="text-white font-semibold text-sm">Gekopieerd</span>
          </span>
        </span>
      </Transition>
    </span>
  );
}
