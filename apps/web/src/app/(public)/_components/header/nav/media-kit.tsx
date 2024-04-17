"use client";
import { Popover, Transition } from "@headlessui/react";
import clsx from "clsx";
import Link from "next/link";
import { Fragment, useRef, useState } from "react";
import Logo from "../../../../_components/brand/logo";
import Wordmark from "../../../../_components/brand/wordmark";
import { logo, wordmark } from "./media-kit-svgs";

export default function MediaKit() {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <Popover className={"relative inline"}>
      <Link
        href="/"
        className="flex shrink-0"
        onContextMenu={(e) => {
          e.preventDefault();
          ref.current?.click();
        }}
      >
        <Logo className="h-24 w-24 p-2 text-white" />
        <Wordmark className="block h-24 lg:hidden xl:block" />
      </Link>
      <Popover.Button ref={ref} className={"hidden"}></Popover.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute -left-8 top-full z-10 mt-3 w-screen max-w-xs rounded-3xl p-4 bg-white shadow-lg ring-1 ring-gray-900/5">
          <CopyButton label="Kopieer Logo als SVG" value={logo} />
          <CopyButton label="Kopieer Woordmerk als SVG" value={wordmark} />
          <div className="group relative flex gap-x-6 rounded-lg p-4 text-sm leading-6 hover:bg-gray-50">
            <div className="flex-auto">
              <a href={"/"} className="block font-semibold text-gray-900">
                Naar de homepagina
                <span className="absolute inset-0" />
              </a>
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [showing, setShowing] = useState(false);

  return (
    <div
      className={clsx(
        "group relative flex gap-x-6 rounded-lg p-4 text-sm leading-6 transition-colors",
        showing
          ? "bg-branding-dark text-white"
          : "hover:bg-gray-50 text-gray-900",
      )}
    >
      <button
        onClick={() => {
          if (typeof navigator.clipboard === "undefined") return;
          navigator.clipboard.writeText(value);

          setShowing(true);
          setTimeout(() => setShowing(false), 400);
        }}
        className="font-semibold text-left w-full"
      >
        {label}
        <span className="absolute inset-0" />
      </button>
    </div>
  );
}
