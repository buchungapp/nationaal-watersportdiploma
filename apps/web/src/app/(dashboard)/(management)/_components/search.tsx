"use client";

import clsx from "clsx";
import { parseAsString, useQueryStates } from "nuqs";
import { useTransition } from "react";
import { Input } from "~/app/(dashboard)/_components/input";
import Spinner from "~/app/_components/spinner";

export default function Search({
  placeholder = "Zoeken...",
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const [isSearchPending, startTransition] = useTransition();

  const [{ query }, setQuery] = useQueryStates(
    {
      page: parseAsString,
      limit: parseAsString,
      query: parseAsString.withDefault(""),
    },
    {
      startTransition,
      // https://nuqs.47ng.com/docs/options#throttling-url-updates
      throttleMs: 300,
      shallow: false,
    },
  );

  return (
    <div className={clsx("relative w-full", className)}>
      <Input
        value={query}
        onChange={(e) => {
          void setQuery({
            query: e.target.value,
            page: null,
            limit: null,
          });
        }}
        placeholder={placeholder}
      />
      {isSearchPending && (
        <div className="right-2 absolute inset-y-0 flex items-center">
          <Spinner />
        </div>
      )}
    </div>
  );
}
