"use server";

import { revalidatePath } from "next/cache";
import { updateCompetencyProgress } from "~/lib/nwd";

export async function updateSingleCompetencyProgress({
  competencyId,
  cohortAllocationId,
  progress,
}: {
  competencyId: string;
  cohortAllocationId: string;
  progress: number;
}) {
  await updateCompetencyProgress({
    cohortAllocationId,
    competencyProgress: [
      {
        competencyId,
        progress,
      },
    ],
  });

  revalidatePath(
    "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
    "page",
  );
  revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
}

export async function updateBulkCompetencyProgress({
  cohortAllocationId,
  progressData,
}: {
  cohortAllocationId: string;
  progressData: {
    competencyId: string;
    progress: number;
  }[];
}) {
  await updateCompetencyProgress({
    cohortAllocationId,
    competencyProgress: progressData,
  });

  revalidatePath(
    "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
    "page",
  );
  revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
}
