"use client";

import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";

export function RouterPreviousButton({ children }: PropsWithChildren) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400"
      onClick={() => router.back()}
    >
      <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
      {children}
    </button>
  );
}
