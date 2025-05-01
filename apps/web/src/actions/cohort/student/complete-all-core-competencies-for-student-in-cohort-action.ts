"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/actions/safe-action";
import { completeAllCoreCompetencies } from "~/lib/nwd";
import { confirmWordSchema } from "./confirm-word";

const completeAllCoreCompetenciesForStudentInCohortSchema = zfd.formData({
  confirm: zfd.text(confirmWordSchema),
});

const completeAllCoreCompetenciesForStudentInCohortArgsSchema: [
  studentAllocationId: z.ZodArray<z.ZodString>,
] = [z.string().array()];

export const completeAllCoreCompetenciesForStudentInCohortAction =
  actionClientWithMeta
    .metadata({
      name: "complete-all-core-competencies-for-student-in-cohort",
    })
    .schema(completeAllCoreCompetenciesForStudentInCohortSchema)
    .bindArgsSchemas(completeAllCoreCompetenciesForStudentInCohortArgsSchema)
    .action(async ({ bindArgsParsedInputs: [studentAllocationId] }) => {
      await completeAllCoreCompetencies({
        cohortAllocationId: studentAllocationId,
      });

      revalidatePath(
        "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
        "page",
      );
      revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
    });
