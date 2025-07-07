import useSWR from "swr";
import { useDebounce } from "use-debounce";
import { serializePersonListSearchParams } from "~/app/api/persons/list/[location]/_search-params";
import type {
  ActorType,
  listPersonsForLocationWithPagination,
} from "~/lib/nwd";
import { jsonFetcher } from "~/lib/swr";

export function usePersonsForLocation(
  locationId: string,
  options: {
    filter?: {
      query?: string | null;
      actorType?: ActorType | [ActorType, ...ActorType[]] | null;
    };
    limit?: number;
    offset?: number;
    debounce?: number;
  },
) {
  const [debouncedQuery] = useDebounce(
    options.filter?.query === "" ? null : options.filter?.query,
    options.debounce ?? 300,
  );

  const searchParams = serializePersonListSearchParams({
    ...options,
    actorType: options.filter?.actorType
      ? Array.isArray(options.filter.actorType)
        ? options.filter.actorType
        : [options.filter.actorType]
      : undefined,
    query: debouncedQuery,
  });

  const { data, error, isLoading } = useSWR<
    Awaited<ReturnType<typeof listPersonsForLocationWithPagination>>
  >(
    ["allPersons", locationId, searchParams],
    () => jsonFetcher(`/api/persons/list/${locationId}${searchParams}`),
    {
      keepPreviousData: true,
      revalidateOnMount: true,
    },
  );

  if (!data) {
    console.log("[usePersonsForLocation] no data with key", [
      "allPersons",
      locationId,
      searchParams,
    ]);
  }

  return {
    data,
    error,
    isLoading,
  };
}
