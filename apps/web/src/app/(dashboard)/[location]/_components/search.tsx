"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useState } from "react";
import { Input } from "../../_components/input";
import { useSetQueryParams } from "../../_utils/set-query-params";

export default function Search() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setQueryParams = useSetQueryParams();

  const [query, setQuery] = useState(searchParams.get("query") ?? "");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    router.push(
      setQueryParams({ query: deferredQuery.length > 0 ? deferredQuery : [] }),
    );
  }, [deferredQuery]);

  return (
    <Input
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
      }}
      placeholder="Zoeken..."
    />
  );
}
