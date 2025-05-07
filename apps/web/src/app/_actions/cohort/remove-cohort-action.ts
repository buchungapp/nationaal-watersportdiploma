"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deleteCohort } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";
import { voidActionSchema } from "../utils";

const removeCohortArgsSchema: [cohortId: z.ZodString] = [z.string().uuid()];

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
