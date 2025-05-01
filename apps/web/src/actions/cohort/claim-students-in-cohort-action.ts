"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateStudentInstructorAssignment } from "~/lib/nwd";
import { actionClientWithMeta, voidActionSchema } from "../safe-action";

const claimStudentsInCohortArgsSchema: [
  cohortId: z.ZodString,
  allocationIds: z.ZodArray<z.ZodString>,
] = [z.string(), z.array(z.string())];

export const claimStudentsInCohortAction = actionClientWithMeta
  .metadata({
    name: "claim-students-in-cohort",
  })
  .schema(voidActionSchema)
  .bindArgsSchemas(claimStudentsInCohortArgsSchema)
  .action(
    async ({ bindArgsParsedInputs: [cohortId, studentAllocationIds] }) => {
      await updateStudentInstructorAssignment({
        cohortId,
        studentAllocationIds,
        action: "claim",
      });

      revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
      revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
      revalidatePath(
        "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
        "page",
      );
    },
  );
