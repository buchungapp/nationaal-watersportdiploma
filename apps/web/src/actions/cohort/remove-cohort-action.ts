"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deleteCohort } from "~/lib/nwd";
import { actionClientWithMeta, voidActionSchema } from "../safe-action";

const removeCohortArgsSchema: [cohortId: z.ZodString] = [z.string()];

export const removeCohortAction = actionClientWithMeta
  .metadata({
    name: "remove-cohort",
  })
  .schema(voidActionSchema)
  .bindArgsSchemas(removeCohortArgsSchema)
  .action(async ({ bindArgsParsedInputs: [cohortId] }) => {
    await deleteCohort(cohortId);

    revalidatePath("/locatie/[location]/cohorten/", "page");
    revalidatePath("/locatie/[location]/cohorten/[cohort]", "layout");

    return;
  });
