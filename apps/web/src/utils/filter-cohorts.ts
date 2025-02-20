import dayjs from "dayjs";
import type { listCohortsForLocation } from "~/lib/nwd";

export function filterCohorts(
  cohorts: Awaited<ReturnType<typeof listCohortsForLocation>>,
  weergave: ("verleden" | "aankomend" | "open")[],
) {
  const now = dayjs();

  return cohorts.filter((cohort) => {
    const startTime = dayjs(cohort.accessStartTime);
    const endTime = dayjs(cohort.accessEndTime);
    return (
      (weergave.includes("verleden") && now.isAfter(endTime)) ||
      (weergave.includes("aankomend") && now.isBefore(startTime)) ||
      (weergave.includes("open") &&
        now.isAfter(startTime) &&
        now.isBefore(endTime))
    );
  });
}
