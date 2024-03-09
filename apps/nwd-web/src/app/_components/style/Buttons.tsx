import { ArrowLongRightIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { ComponentProps } from "react";

export function BoxedButton({ className, children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
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
