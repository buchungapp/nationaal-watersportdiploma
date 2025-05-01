"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { withdrawStudentFromCurriculumInCohort } from "~/lib/nwd";
import { actionClientWithMeta } from "../../safe-action";

const withdrawStudentFromCurriculumInCohortArgsSchema: [
  allocationId: z.ZodString,
] = [z.string()];

export const withdrawStudentFromCurriculumInCohortAction = actionClientWithMeta
  .metadata({
    name: "withdraw-student-from-curriculum-in-cohort",
  })
  .bindArgsSchemas(withdrawStudentFromCurriculumInCohortArgsSchema)
  .action(async ({ bindArgsParsedInputs: [allocationId] }) => {
    await withdrawStudentFromCurriculumInCohort({ allocationId });

    revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
    revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
    revalidatePath(
      "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
      "page",
    );
  });
