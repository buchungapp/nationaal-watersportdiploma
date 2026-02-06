import type { User } from "@nawadi/core";
import useSWR from "swr";
import { useDebounce } from "use-debounce";
import { serializePersonSearchParams } from "~/app/api/persons/search/_search-params";
import { jsonFetcher } from "~/lib/swr";

type SearchPerson = Awaited<
  ReturnType<typeof User.Person.searchForAutocomplete>
>[number];

export function usePersonSearch(
  query: string | null,
  options?: {
    excludePersonId?: string | null;
    limit?: number;
    debounce?: number;
  },
) {
  const [debouncedQuery] = useDebounce(
    query === "" ? null : query,
    options?.debounce ?? 300,
  );

  const searchParams = serializePersonSearchParams({
    query: debouncedQuery,
    limit: options?.limit ?? 10,
    excludePersonId: options?.excludePersonId ?? null,
  });

  const { data, error, isLoading } = useSWR<SearchPerson[]>(
    debouncedQuery ? ["personSearch", searchParams] : null,
    () => jsonFetcher(`/api/persons/search${searchParams}`),
    {
      keepPreviousData: true,
      revalidateOnMount: true,
    },
  );

  return {
    data: data ?? [],
    debouncedQuery,
    error,
    isLoading,
  };
}
