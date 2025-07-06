import useSWR from "swr";
import { jsonFetcher } from "~/lib/swr";

interface Kwalificatieprofiel {
  id: string;
  titel: string;
  richting: string;
  niveau: {
    id: string;
    rang: number;
  };
  kerntaken: Array<{
    id: string;
    titel: string;
    type: string;
    rang: number | null;
    onderdelen: Array<{
      id: string;
      type: string;
    }>;
  }>;
}

interface KwalificatieprofielenResponse {
  items: Kwalificatieprofiel[];
  total: number;
}

export function useKwalificatieprofielenByNiveau(niveauId: string | null) {
  const { data, error, isLoading, mutate } =
    useSWR<KwalificatieprofielenResponse>(
      niveauId ? `/api/kwalificatieprofielen/by-niveau/${niveauId}` : null,
      jsonFetcher,
      {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 minute
      },
    );

  return {
    kwalificatieprofielen: data?.items ?? [],
    isLoading,
    isError: error,
    mutate,
  };
}
