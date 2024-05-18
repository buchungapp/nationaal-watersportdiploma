"use client";

import { type ComponentPropsWithoutRef } from "react";

export default function PrintPage({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      {...props}
      onClick={(e) => {
        if (typeof window.print === "undefined") return;
        window.print();
        props.onClick?.(e);
        return;
      }}
      className={className}
    >
      {children}
    </button>
  );
}
