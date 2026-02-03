"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { listCohortsForLocation, moveAllocationById } from "~/lib/nwd";
import { filterCohorts } from "~/utils/filter-cohorts";
import { actionClientWithMeta } from "../safe-action";

const moveStudentToCohortSchema = zfd.formData({
  cohort: z.object({
    id: zfd.text(z.string().uuid()),
  }),
});

const moveStudentToCohortArgsSchema: [
  locationId: z.ZodString,
  cohortId: z.ZodString,
  allocationId: z.ZodString,
] = [z.string().uuid(), z.string().uuid(), z.string().uuid()];

export const moveStudentToCohortAction = actionClientWithMeta
  .metadata({
    name: "move-student-to-cohort",
  })
  .inputSchema(moveStudentToCohortSchema)
  .bindArgsSchemas(moveStudentToCohortArgsSchema)
  .action(
    async ({
      bindArgsParsedInputs: [locationId, cohortId, allocationId],
      parsedInput: {
        cohort: { id: newCohortId },
      },
    }) => {
      const cohorts = await listCohortsForLocation(locationId).then((cohorts) =>
        filterCohorts(cohorts, ["open", "aankomend"]),
      );

      const newCohort = cohorts.find((cohort) => cohort.id === newCohortId);
      if (!newCohort) {
        throw new Error("Cohort niet gevonden");
      }

      const result = await moveAllocationById({
        locationId,
        allocationId,
        cohortId,
        newCohortId,
      });

      revalidatePath(
        "/locatie/[location]/cohorten/[cohort]/instructeurs",
        "page",
      );
      revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
      revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");

      return {
        cohort: newCohort,
        allocation: result,
      };
    },
  );
