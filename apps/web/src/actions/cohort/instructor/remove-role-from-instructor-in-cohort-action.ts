"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionClientWithMeta } from "~/actions/safe-action";
import { removeCohortRole } from "~/lib/nwd";

const removeRoleFromInstructorInCohortArgsSchema: [
  cohortId: z.ZodString,
  allocationId: z.ZodString,
  roleHandle: z.ZodLiteral<"cohort_admin">,
] = [z.string(), z.string(), z.literal("cohort_admin")];

export const removeRoleFromInstructorInCohortAction = actionClientWithMeta
  .metadata({
    name: "remove-role-from-instructor-in-cohort",
  })
  .bindArgsSchemas(removeRoleFromInstructorInCohortArgsSchema)
  .action(
    async ({ bindArgsParsedInputs: [cohortId, allocationId, roleHandle] }) => {
      await removeCohortRole({
        cohortId,
        allocationId,
        roleHandle,
      });

      revalidatePath(
        "/locatie/[location]/cohorten/[cohort]/instructeurs",
        "page",
      );
    },
  );
