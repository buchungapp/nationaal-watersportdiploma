"use server";
import { CoreError, CoreErrorType } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
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
  .inputSchema(createCohortSchema)
  .bindArgsSchemas(bindArgsSchemas)
  .action(
    async ({
      parsedInput: { label, accessStartTime, accessEndTime },
      bindArgsParsedInputs: [locationId],
    }) => {
      try {
        await createCohort({
          locationId,
          label,
          accessStartTimestamp: accessStartTime,
          accessEndTimestamp: accessEndTime,
        });
      } catch (error) {
        console.log(error);

        if (error instanceof CoreError) {
          if (error.type === CoreErrorType.UniqueKey) {
            throw new Error("Er is al een cohort met deze naam");
          }
        }

        throw error;
      }

      revalidatePath("/locatie/[location]/cohorten", "page");
    },
  );
