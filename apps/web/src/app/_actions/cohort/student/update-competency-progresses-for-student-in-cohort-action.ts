"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { updateCompetencyProgress } from "~/lib/nwd";

const updateCompetencyProgressesForStudentInCohortSchema = z
  .object({
    competencyId: z.string().uuid(),
    progress: z.number().int().min(0).max(100),
  })
  .array();

const bindArgsSchemas: [allocationId: z.ZodString] = [z.string().uuid()];

export const updateCompetencyProgressesForStudentInCohortAction =
  actionClientWithMeta
    .metadata({
      name: "update-competency-progresses-for-student-in-cohort",
    })
    .inputSchema(updateCompetencyProgressesForStudentInCohortSchema)
    .bindArgsSchemas(bindArgsSchemas)
    .action(
      async ({
        parsedInput: competencyProgresses,
        bindArgsParsedInputs: [allocationId],
      }) => {
        await updateCompetencyProgress({
          cohortAllocationId: allocationId,
          competencyProgress: competencyProgresses,
        });

        revalidatePath(
          "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
          "page",
        );
        revalidatePath(
          "/locatie/[location]/cohorten/[cohort]/diplomas",
          "page",
        );
      },
    );
