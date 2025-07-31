import {
  ArrowLeftIcon,
  ArrowLongRightIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps } from "react";
import BackButton from "./back-button";

export function BoxedButton({
  className,
  children,
  ...props
}: ComponentProps<typeof Link | "button">) {
  if ("href" in props) {
    return (
      <Link
        {...props}
        className={clsx(
          "group flex justify-between gap-1 px-4 py-2 rounded-lg w-fit font-semibold text-sm transition-colors",
          className,
        )}
      >
        {children}
        <ArrowLongRightIcon
          className="size-5 transition-transform group-hover:translate-x-1 shrink-0"
          strokeWidth={2.5}
        />
      </Link>
    );
  }

  return (
    <button
      {...props}
      className={clsx(
        "group flex justify-between gap-1 px-4 py-2 rounded-lg w-fit font-semibold text-sm transition-colors",
        className,
      )}
    >
      {children}
      <ArrowLongRightIcon
        className="size-5 transition-transform group-hover:translate-x-1 shrink-0"
        strokeWidth={2.5}
      />
    </button>
  );
}

export function TekstButton({
  className,
  children,
  backwards = false,
  ...props
}: ComponentProps<typeof Link> & { backwards?: boolean }) {
  return (
    <Link
      {...props}
      className={clsx(
        "group flex justify-between items-center gap-1 -mx-2.5 -my-1.5 px-2.5 py-1.5 rounded-lg w-fit font-semibold text-sm transition-colors",
        className,
      )}
    >
      {backwards ? (
        <ArrowLeftIcon
          className="size-4 transition-transform group-hover:-translate-x-1 shrink-0"
          strokeWidth={2.5}
        />
      ) : null}
      {children}
      {!backwards ? (
        <ArrowRightIcon
          className="size-4 transition-transform group-hover:translate-x-1 shrink-0"
          strokeWidth={2.5}
        />
      ) : null}
    </Link>
  );
}

export function InlineButton({
  className,
  children,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={clsx(
        "hover:bg-slate-100 hover:-mx-2 hover:px-2 rounded-lg transition-[padding,margin,background-color]",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function BoxedBackButton({
  className,
  children,
  ...props
}: ComponentProps<"button">) {
  return (
    <BackButton
      {...props}
      className={clsx(
        "group flex items-center gap-1 px-4 py-2 rounded-lg w-fit font-semibold text-sm",
        className,
      )}
    >
      {children}
      <ArrowLongRightIcon
        className="size-5 transition-transform group-hover:translate-x-1"
        strokeWidth={2.5}
      />
    </BackButton>
  );
}
