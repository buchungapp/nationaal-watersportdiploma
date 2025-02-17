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
}: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={clsx(
        "group flex w-fit gap-1 justify-between rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
        className,
      )}
    >
      {children}
      <ArrowLongRightIcon
        className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1"
        strokeWidth={2.5}
      />
    </Link>
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
        "group -mx-2.5 -my-1.5 flex w-fit items-center gap-1 justify-between rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors",
        className,
      )}
    >
      {backwards ? (
        <ArrowLeftIcon
          className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-1"
          strokeWidth={2.5}
        />
      ) : null}
      {children}
      {!backwards ? (
        <ArrowRightIcon
          className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
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
        "rounded-lg transition-[padding,margin,background-color] hover:-mx-2 hover:bg-slate-100 hover:px-2",
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
        "group flex w-fit items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold",
        className,
      )}
    >
      {children}
      <ArrowLongRightIcon
        className="h-5 w-5 transition-transform group-hover:translate-x-1"
        strokeWidth={2.5}
      />
    </BackButton>
  );
}
