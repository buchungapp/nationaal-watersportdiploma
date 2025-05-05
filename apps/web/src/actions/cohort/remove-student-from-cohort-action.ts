"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { releaseStudentFromCohortByAllocationId } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const removeStudentFromCohortArgsSchema: [
  locationId: z.ZodString,
  cohortId: z.ZodString,
  allocationId: z.ZodString,
] = [z.string().uuid(), z.string().uuid(), z.string().uuid()];

export const removeStudentFromCohortAction = actionClientWithMeta
  .metadata({
    name: "remove-student-from-cohort",
  })
  .bindArgsSchemas(removeStudentFromCohortArgsSchema)
  .action(
    async ({ bindArgsParsedInputs: [locationId, cohortId, allocationId] }) => {
      await releaseStudentFromCohortByAllocationId({
        locationId,
        cohortId,
        allocationId,
      });

      revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
      revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
    },
  );
