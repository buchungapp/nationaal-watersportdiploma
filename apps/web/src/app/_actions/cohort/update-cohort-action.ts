"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateCohortDetails } from "~/lib/nwd";
import { dateInputToIsoString } from "../dates";
import { actionClientWithMeta } from "../safe-action";

const updateCohortSchema = zfd.formData({
  label: zfd.text(z.string().optional()),
  accessStartTime: zfd.text(
    dateInputToIsoString(z.string().datetime().optional()),
  ),
  accessEndTime: zfd.text(
    dateInputToIsoString(z.string().datetime().optional()),
  ),
});

const updateCohortArgsSchema: [cohortId: z.ZodString] = [z.string().uuid()];

export const updateCohortAction = actionClientWithMeta
  .metadata({
    name: "update-cohort",
  })
  .inputSchema(updateCohortSchema)
  .bindArgsSchemas(updateCohortArgsSchema)
  .action(async ({ parsedInput: data, bindArgsParsedInputs: [cohortId] }) => {
    await updateCohortDetails({
      cohortId,
      label: data.label,
      accessStartTimestamp: data.accessStartTime,
      accessEndTimestamp: data.accessEndTime,
    });

    revalidatePath("/locatie/[location]/cohorten/", "page");
    revalidatePath("/locatie/[location]/cohorten/[cohort]", "layout");
  });
