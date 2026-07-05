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
    async ({ bindArgsParsedInputs: [_locationId, cohortId, allocationId] }) => {
      // This action removes an instructor allocation only; reject student
      // allocations so a mismatched id can never drop a student.
      await removeAllocationById({
        cohortId,
        allocationId,
        expectedActorType: "instructor",
      });

      revalidatePath(
        "/locatie/[location]/cohorten/[cohort]/instructeurs",
        "page",
      );
      revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
      revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
    },
  );
