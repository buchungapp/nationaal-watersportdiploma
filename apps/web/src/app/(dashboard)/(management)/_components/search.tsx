"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "~/app/(dashboard)/_components/input";
import Spinner from "~/app/_components/spinner";

export default function Search({ placeholder = "Zoeken...", debounce = 300 }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pathname = usePathname();
  const [isNavPending, startTransition] = useTransition();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    params.delete("limit");

    if (term) {
      params.set("query", encodeURIComponent(term.trim()));
    } else {
      params.delete("query");
    }
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }, debounce);

  return (
    <div className="relative w-full">
      <Input
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
        placeholder={placeholder}
        defaultValue={searchParams.get("query")?.toString()}
      />
      {isNavPending && (
        <div className="absolute inset-y-0 right-2 flex items-center">
          <Spinner />
        </div>
      )}
    </div>
  );
}
