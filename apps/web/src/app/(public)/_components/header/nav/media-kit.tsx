"use client";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { HomeIcon, SparklesIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { Fragment, useCallback, useRef, useState } from "react";
import Logo from "../../../../_components/brand/logo";
import Wordmark from "../../../../_components/brand/wordmark";
import { logo, wordmark } from "./media-kit-svgs";

export default function MediaKit() {
  const ref = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const intent = useRef<"homepage" | "context">("homepage");

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (intent.current === "homepage") {
        e.preventDefault();
        router.push("/");
      }
    },
    [router, intent.current],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      intent.current = "context";
      e.preventDefault();
      ref.current?.click();
      intent.current = "homepage";
    },
    [intent.current],
  );

  return (
    <Popover className="relative inline">
      <PopoverButton
        ref={ref}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className="flex shrink-0"
      >
        <Logo className="h-24 w-24 p-2 text-white" />
        <Wordmark className="block h-24 lg:hidden xl:block" />
      </PopoverButton>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <PopoverPanel className="absolute -left-4 top-full z-10 mt-3 w-screen max-w-xs rounded-xl px-2.5 py-4 bg-white shadow-lg ring-1 ring-slate-900/5">
          <CopyButton
            label={(active) => (
              <div className="flex items-center gap-x-2.5">
                <span
                  className={clsx(
                    "border-2 block size-4 rounded-full transition-colors",
                    active ? "border-white" : "border-slate-600",
                  )}
                />
                <p>Kopieer logo als SVG</p>
              </div>
            )}
            value={logo}
          />
          <CopyButton
            label={(active) => (
              <div className="flex items-center gap-x-2.5">
                <span
                  className={clsx(
                    "font-serif leading-5 w-4 text-center transition-colors",
                    active ? "text-white" : "text-slate-600",
                  )}
                >
                  N
                </span>
                <p>Kopieer woordmerk als SVG</p>
              </div>
            )}
            value={wordmark}
          />
          <Link
            href="/merk"
            className="relative flex items-center gap-x-2.5 rounded-lg px-4 py-2 text-sm leading-6 hover:bg-slate-50"
            onClick={() => {
              ref.current?.click();
            }}
          >
            <SparklesIcon
              className="size-4 text-slate-600"
              aria-hidden={true}
            />
            <p className="block font-semibold text-slate-900">
              Brand guidelines
            </p>
          </Link>
          <Link
            href="/"
            className="relative flex items-center gap-x-2.5 rounded-lg px-4 py-2 text-sm leading-6 hover:bg-slate-50"
            onClick={() => {
              ref.current?.click();
            }}
          >
            <HomeIcon className="size-4 text-slate-600" aria-hidden={true} />
            <p className="block font-semibold text-slate-900">Homepagina</p>
          </Link>
        </PopoverPanel>
      </Transition>
    </Popover>
  );
}

function CopyButton({
  value,
  label,
}: {
  value: string;
  label: ((active: boolean) => React.ReactNode) | React.ReactNode;
}) {
  const [showing, setShowing] = useState(false);

  return (
    <div
      className={clsx(
        "relative flex gap-x-2.5 rounded-lg px-4 py-2 text-sm leading-6 transition-colors",
        showing
          ? "bg-branding-dark text-white"
          : "hover:bg-slate-50 text-slate-900",
      )}
    >
      <button
        type="button"
        onClick={async () => {
          if (typeof navigator.clipboard === "undefined") return;
          await navigator.clipboard.writeText(value);

          setShowing(true);
          setTimeout(() => setShowing(false), 400);
        }}
        className="font-semibold text-left w-full"
      >
        {typeof label === "function" ? label(showing) : label}
      </button>
    </div>
  );
}
