"use client";

import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
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
          <div className="h-5 w-5">
            <div
              style={{
                position: "relative",
                top: "50%",
                left: "50%",
              }}
              className={clsx("loading-spinner", "h-5 w-5")}
            >
              {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    animationDelay: `${-1.2 + 0.1 * i}s`,
                    background: "gray",
                    position: "absolute",
                    borderRadius: "1rem",
                    width: "30%",
                    height: "8%",
                    left: "-10%",
                    top: "-4%",
                    transform: `rotate(${30 * i}deg) translate(120%)`,
                  }}
                  className="animate-spinner"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
