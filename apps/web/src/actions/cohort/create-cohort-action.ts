"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/actions/safe-action";
import { createCohort } from "~/lib/nwd";
import { dateInputToIsoString } from "../dates";

const createCohortSchema = zfd.formData({
  label: zfd.text(),
  accessStartTime: zfd.text(dateInputToIsoString()),
  accessEndTime: zfd.text(dateInputToIsoString()),
});

const bindArgsSchemas: [locationId: z.ZodString] = [z.string().uuid()];

export const createCohortAction = actionClientWithMeta
  .metadata({
    name: "create-cohort",
  })
  .schema(createCohortSchema)
  .bindArgsSchemas(bindArgsSchemas)
  .action(
    async ({
      parsedInput: { label, accessStartTime, accessEndTime },
      bindArgsParsedInputs: [locationId],
    }) => {
      await createCohort({
        locationId,
        label,
        accessStartTimestamp: accessStartTime,
        accessEndTimestamp: accessEndTime,
      });

      revalidatePath("/locatie/[location]/cohorten", "page");
    },
  );
