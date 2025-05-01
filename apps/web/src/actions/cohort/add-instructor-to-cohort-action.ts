"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addInstructorToCohortByPersonId } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const addInstructorToCohortArgsSchema: [
  locationId: z.ZodString,
  cohortId: z.ZodString,
  personId: z.ZodString,
] = [z.string(), z.string(), z.string()];

export const addInstructorToCohortAction = actionClientWithMeta
  .metadata({
    name: "add-instructor-to-cohort",
  })
  .bindArgsSchemas(addInstructorToCohortArgsSchema)
  .action(
    async ({ bindArgsParsedInputs: [locationId, cohortId, personId] }) => {
      await addInstructorToCohortByPersonId({
        locationId,
        cohortId,
        personId,
      });

      revalidatePath(
        "/locatie/[location]/cohorten/[cohort]/instructeurs",
        "page",
      );
    },
  );
