"use client";

import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <div className="h-6 w-7 relative">
      <button
        className="absolute -top-0.5 left-0 bg-zinc-100 p-1 rounded-md text-zinc-500"
        onClick={() => router.back()}
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
