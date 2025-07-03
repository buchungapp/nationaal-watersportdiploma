import useSWR from "swr";
import { jsonFetcher } from "~/lib/swr";

interface InstructiegroepResponse {
  id: string;
  title: string;
  richting: string;
  courses: Array<{
    id: string;
    handle: string;
    title: string | null;
  }>;
}

export function useInstructiegroepByCourse(
  courseId: string | null,
  richting: "instructeur" | "leercoach" | "pvb_beoordelaar" = "instructeur",
) {
  const { data, error, isLoading, mutate } =
    useSWR<InstructiegroepResponse | null>(
      courseId
        ? `/api/instructiegroep/by-course/${courseId}?richting=${richting}`
        : null,
      jsonFetcher,
      {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 minute
      },
    );

  return {
    instructiegroep: data,
    isLoading,
    isError: error,
    mutate,
  };
}
