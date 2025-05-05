"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { removeAllocationById } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const removeInstructorFromCohortArgsSchema: [
  locationId: z.ZodString,
  cohortId: z.ZodString,
  allocationId: z.ZodString,
] = [z.string().uuid(), z.string().uuid(), z.string().uuid()];

export const removeInstructorFromCohortAction = actionClientWithMeta
  .metadata({
    name: "remove-instructor-from-cohort",
  })
  .bindArgsSchemas(removeInstructorFromCohortArgsSchema)
  .action(
    async ({ bindArgsParsedInputs: [locationId, cohortId, allocationId] }) => {
      // TODO: Check only for instructors and not students?

      await removeAllocationById({
        locationId,
        cohortId,
        allocationId,
      });

      revalidatePath(
        "/locatie/[location]/cohorten/[cohort]/instructeurs",
        "page",
      );
      revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
      revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
    },
  );
