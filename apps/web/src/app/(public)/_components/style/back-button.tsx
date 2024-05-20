"use client";

import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";

export default function BackButton({
  children,
  ...props
}: PropsWithChildren<React.ComponentPropsWithoutRef<"button">>) {
  const router = useRouter();

  return (
    <button type="button" onClick={() => router.back()} {...props}>
      {children}
    </button>
  );
}
