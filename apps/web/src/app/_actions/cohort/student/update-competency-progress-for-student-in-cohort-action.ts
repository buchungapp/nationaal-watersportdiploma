"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { updateCompetencyProgress } from "~/lib/nwd";

const updateCompetencyProgressForStudentInCohortSchema = zfd.formData({
  competencyId: zfd.text(z.string().uuid()),
  progress: zfd.numeric(z.number().int().min(0).max(100)),
});

const bindArgsSchemas: [allocationId: z.ZodString] = [z.string().uuid()];

export const updateCompetencyProgressForStudentInCohortAction =
  actionClientWithMeta
    .metadata({
      name: "update-competency-progress-for-student-in-cohort",
    })
    .inputSchema(updateCompetencyProgressForStudentInCohortSchema)
    .bindArgsSchemas(bindArgsSchemas)
    .action(
      async ({
        parsedInput: { competencyId, progress },
        bindArgsParsedInputs: [allocationId],
      }) => {
        await updateCompetencyProgress({
          cohortAllocationId: allocationId,
          competencyProgress: [
            {
              competencyId,
              progress,
            },
          ],
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
