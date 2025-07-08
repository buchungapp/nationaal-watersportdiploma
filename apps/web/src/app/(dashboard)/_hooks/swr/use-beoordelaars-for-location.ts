import useSWR from "swr";
import { jsonFetcher } from "~/lib/swr";

export interface Beoordelaar {
  id: string;
  handle: string | null;
  firstName: string;
  lastName: string | null;
  lastNamePrefix: string | null;
  email: string | null;
}

export function useBeoordelaarsForLocation(locationId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Beoordelaar[]>(
    locationId ? ["beoordelaars", locationId] : null,
    locationId
      ? () => jsonFetcher(`/api/beoordelaars/list/${locationId}`)
      : null,
    {
      revalidateOnMount: true,
    },
  );

  return {
    beoordelaars: data ?? [],
    error,
    isLoading,
    mutate,
  };
}
