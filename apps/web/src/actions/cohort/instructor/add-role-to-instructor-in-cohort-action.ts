"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionClientWithMeta } from "~/actions/safe-action";
import { addCohortRole } from "~/lib/nwd";

const addRoleToInstructorInCohortArgsSchema: [
  cohortId: z.ZodString,
  allocationId: z.ZodString,
  roleHandle: z.ZodLiteral<"cohort_admin">,
] = [z.string(), z.string(), z.literal("cohort_admin")];

export const addRoleToInstructorInCohortAction = actionClientWithMeta
  .metadata({
    name: "add-role-to-instructor-in-cohort",
  })
  .bindArgsSchemas(addRoleToInstructorInCohortArgsSchema)
  .action(
    async ({ bindArgsParsedInputs: [cohortId, allocationId, roleHandle] }) => {
      await addCohortRole({
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
