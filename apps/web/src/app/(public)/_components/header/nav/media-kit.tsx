"use client";
import { Popover, Transition } from "@headlessui/react";
import { HomeIcon, SparklesIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import Link from "next/link";
import React, { Fragment, useRef, useState } from "react";
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
        <Popover.Panel className="absolute -left-4 top-full z-10 mt-3 w-screen max-w-xs rounded-xl px-2.5 py-4 bg-white shadow-lg ring-1 ring-gray-900/5">
          <CopyButton
            label={
              <div className="flex items-center gap-x-2.5">
                <span className="border-gray-600 border-2 block h-4 w-4 rounded-full" />
                <p>Kopieer logo als SVG</p>
              </div>
            }
            value={logo}
          />
          <CopyButton
            label={
              <div className="flex items-center gap-x-2.5">
                <span className="font-serif text-gray-600 leading-5 w-4 text-center">
                  N
                </span>
                <p>Kopieer woordmerk als SVG</p>
              </div>
            }
            value={wordmark}
          />
          <Link
            href="/merk"
            className="relative flex items-center gap-x-2.5 rounded-lg px-4 py-2 text-sm leading-6 hover:bg-gray-50"
          >
            <SparklesIcon
              className="h-4 w-4 text-gray-600"
              aria-hidden={true}
            />
            <p className="block font-semibold text-gray-900">
              Brand guidelines
            </p>
          </Link>
          <Link
            href="/"
            className="relative flex items-center gap-x-2.5 rounded-lg px-4 py-2 text-sm leading-6 hover:bg-gray-50"
          >
            <HomeIcon className="h-4 w-4 text-gray-600" aria-hidden={true} />
            <p className="block font-semibold text-gray-900">Homepagina</p>
          </Link>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
}

function CopyButton({
  value,
  label,
}: {
  value: string;
  label: React.ReactNode;
}) {
  const [showing, setShowing] = useState(false);

  return (
    <div
      className={clsx(
        "relative flex gap-x-2.5 rounded-lg px-4 py-2 text-sm leading-6 transition-colors",
        showing
          ? "bg-branding-dark text-white"
          : "hover:bg-gray-50 text-gray-900",
      )}
    >
      <button
        onClick={async () => {
          if (typeof navigator.clipboard === "undefined") return;
          await navigator.clipboard.writeText(value);

          setShowing(true);
          setTimeout(() => setShowing(false), 400);
        }}
        className="font-semibold text-left w-full"
      >
        {label}
      </button>
    </div>
  );
}
