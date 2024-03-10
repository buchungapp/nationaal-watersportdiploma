import { ArrowLongRightIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { ComponentProps } from "react";
import BackButton from "../BackButton";

export function BoxedButton({ className, children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={clsx(
        "group transition-colors text-sm font-semibold px-4 py-2 flex gap-1 w-fit rounded-lg items-center",
        className,
      )}
    >
      {children}
      <ArrowLongRightIcon
        className="w-5 h-5 group-hover:translate-x-1 transition-transform"
        strokeWidth={2.5}
      />
    </Link>
  );
}

export function TekstButton({ className, children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={clsx("flex gap-1 items-center w-fit font-semibold group", className)}
    >
      {children}
      <ArrowRightIcon
        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
        strokeWidth={2.5}
      />
    </Link>
  );
}

export function InlineButton({ className, children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={clsx(
        "rounded-lg hover:-mx-2 hover:px-2 transition-[padding,margin,background-color] hover:bg-slate-100",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function BoxedBackButton({ className, children, ...props }: ComponentProps<"button">) {
  return (
    <BackButton
      {...props}
      className={clsx(
        "group text-sm font-semibold px-4 py-2 flex gap-1 w-fit rounded-lg items-center",
        className,
      )}
    >
      {children}
      <ArrowLongRightIcon
        className="w-5 h-5 group-hover:translate-x-1 transition-transform"
        strokeWidth={2.5}
      />
    </BackButton>
  );
}

export function TekstBackButton({ className, children, ...props }: ComponentProps<"button">) {
  return (
    <BackButton
      {...props}
      className={clsx("flex gap-1 items-center w-fit font-semibold group", className)}
    >
      {children}
      <ArrowRightIcon
        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
        strokeWidth={2.5}
      />
    </BackButton>
  );
}
