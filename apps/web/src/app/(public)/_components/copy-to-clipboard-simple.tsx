"use client";

import type { ComponentPropsWithoutRef } from "react";
import { toast } from "sonner";

export default function CopyToClipboard({
  children,
  copyValue: value,
  className,
  ...props
}: ComponentPropsWithoutRef<"button"> & { copyValue: string }) {
  return (
    <button
      {...props}
      onClick={async (e) => {
        if (typeof navigator.clipboard === "undefined") return;
        await navigator.clipboard.writeText(value);
        props.onClick?.(e);

        toast.info("Gekopieerd!");
        return;
      }}
      className={className}
    >
      {children}
    </button>
  );
}
