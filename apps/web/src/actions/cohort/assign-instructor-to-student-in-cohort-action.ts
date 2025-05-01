"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateStudentInstructorAssignment } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const assignInstructorToStudentInCohortSchema = zfd.formData({
  instructorPersonId: zfd.text(z.string().uuid().optional()),
});

const assignInstructorToStudentInCohortArgsSchema: [
  cohortId: z.ZodString,
  allocationIds: z.ZodArray<z.ZodString>,
] = [z.string().uuid(), z.array(z.string().uuid())];

export const assignInstructorToStudentInCohortAction = actionClientWithMeta
  .metadata({
    name: "assign-instructor-to-student-in-cohort",
  })
  .schema(assignInstructorToStudentInCohortSchema)
  .bindArgsSchemas(assignInstructorToStudentInCohortArgsSchema)
  .action(
    async ({
      parsedInput: { instructorPersonId },
      bindArgsParsedInputs: [cohortId, studentAllocationIds],
    }) => {
      if (instructorPersonId) {
        await updateStudentInstructorAssignment({
          cohortId,
          studentAllocationIds,
          action: "claim",
          instructorPersonId,
        });
      } else {
        await updateStudentInstructorAssignment({
          cohortId,
          studentAllocationIds,
          action: "release",
        });
      }

      revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
      revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
      revalidatePath(
        "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
        "page",
      );
    },
  );
