"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import Spinner from "~/app/_components/spinner";
import { Input } from "../../_components/input";
import { useSetQueryParams } from "../../_utils/set-query-params";

export default function Search() {
  // TODO: this still needs debouncing
  const router = useRouter();
  const searchParams = useSearchParams();
  const setQueryParams = useSetQueryParams();

  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const deferredQuery = useDeferredValue(query);
  const [isNavPending, startTransition] = useTransition();

  const isPending = deferredQuery !== query || isNavPending;

  useEffect(() => {
    startTransition(() =>
      router.push(
        setQueryParams({
          query: deferredQuery.length > 0 ? deferredQuery : [],
        }),
      ),
    );
  }, [deferredQuery]);

  return (
    <div className="relative w-full">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
        }}
        placeholder="Zoeken..."
      />
      {isPending && (
        <div className="absolute inset-y-0 right-2 flex items-center">
          <Spinner />
        </div>
      )}
    </div>
  );
}
