"use client";

import { parseAsString, useQueryStates } from "nuqs";
import { useTransition } from "react";
import { Input } from "~/app/(dashboard)/_components/input";
import Spinner from "~/app/_components/spinner";

export default function Search({ placeholder = "Zoeken..." }) {
  const [isNavPending, startTransition] = useTransition();

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
    <div className="relative w-full">
      <Input
        value={decodeURIComponent(query)}
        onChange={(e) => {
          void setQuery({
            query: encodeURIComponent(e.target.value),
            page: null,
            limit: null,
          });
        }}
        placeholder={placeholder}
      />
      {isNavPending && (
        <div className="absolute inset-y-0 right-2 flex items-center">
          <Spinner />
        </div>
      )}
    </div>
  );
}
