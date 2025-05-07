"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { makeProgressVisible } from "~/lib/nwd";

const makeProgressVisibleForStudentInCohortArgsSchema: [
  cohortId: z.ZodString,
  allocationId: z.ZodString,
] = [z.string().uuid(), z.string().uuid()];

export const makeProgressVisibleForStudentInCohortAction = actionClientWithMeta
  .metadata({
    name: "make-progress-visible-for-student-in-cohort",
  })
  .bindArgsSchemas(makeProgressVisibleForStudentInCohortArgsSchema)
  .action(async ({ bindArgsParsedInputs: [cohortId, allocationId] }) => {
    await makeProgressVisible({ cohortId, allocationId });

    revalidatePath(
      "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
      "page",
    );
    revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
    revalidatePath("/profiel/[handle]/voortgang/[allocation-id]", "page");
  });
