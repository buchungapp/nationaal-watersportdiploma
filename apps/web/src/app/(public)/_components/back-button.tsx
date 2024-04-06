"use client";

import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";

import { useHasPreviousPathname } from "../../_components/providers";

export default function BackButton({
  children,
  ...props
}: PropsWithChildren<React.ComponentPropsWithoutRef<"button">>) {
  const router = useRouter();
  const hasPrevious = useHasPreviousPathname();

  if (!hasPrevious) return null;

  return (
    <button type="button" onClick={() => router.back()} {...props}>
      {children}
    </button>
  );
}
