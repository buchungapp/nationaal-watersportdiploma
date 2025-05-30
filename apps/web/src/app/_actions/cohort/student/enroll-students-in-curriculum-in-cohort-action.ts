"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { enrollStudentsInCurriculumForCohort } from "~/lib/nwd";
import { actionClientWithMeta } from "../../safe-action";

const enrollStudentsInCurriculumInCohortSchema = zfd.formData({
  gearType: z.object({
    id: zfd.text(z.string().uuid()),
  }),
  curriculum: z.object({
    id: zfd.text(z.string().uuid()),
  }),
});

const studentAllocationSchema = z
  .object({
    allocationId: z.string().uuid(),
    personId: z.string().uuid(),
  })
  .array();

const enrollStudentsInCurriculumInCohortArgsSchema: [
  cohortId: z.ZodString,
  students: typeof studentAllocationSchema,
] = [z.string().uuid(), studentAllocationSchema];

export const enrollStudentsInCurriculumInCohortAction = actionClientWithMeta
  .metadata({
    name: "enroll-students-in-curriculum-in-cohort",
  })
  .schema(enrollStudentsInCurriculumInCohortSchema)
  .bindArgsSchemas(enrollStudentsInCurriculumInCohortArgsSchema)
  .action(
    async ({
      parsedInput: {
        gearType: { id: gearTypeId },
        curriculum: { id: curriculumId },
      },
      bindArgsParsedInputs: [cohortId, students],
    }) => {
      await enrollStudentsInCurriculumForCohort({
        cohortId,
        curriculumId,
        gearTypeId,
        students,
      });

      revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
      revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
      revalidatePath(
        "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
        "page",
      );
    },
  );
