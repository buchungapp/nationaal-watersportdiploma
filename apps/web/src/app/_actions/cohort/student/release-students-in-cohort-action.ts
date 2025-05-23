"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateStudentInstructorAssignment } from "~/lib/nwd";
import { actionClientWithMeta } from "../../safe-action";
import { voidActionSchema } from "../../utils";

const releaseStudentsInCohortArgsSchema: [
  cohortId: z.ZodString,
  allocationIds: z.ZodArray<z.ZodString>,
] = [z.string().uuid(), z.array(z.string().uuid())];

export const releaseStudentsInCohortAction = actionClientWithMeta
  .metadata({
    name: "release-students-in-cohort",
  })
  .schema(voidActionSchema)
  .bindArgsSchemas(releaseStudentsInCohortArgsSchema)
  .action(
    async ({ bindArgsParsedInputs: [cohortId, studentAllocationIds] }) => {
      await updateStudentInstructorAssignment({
        cohortId,
        studentAllocationIds,
        action: "release",
      });

      revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
      revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
      revalidatePath(
        "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
        "page",
      );
    },
  );
