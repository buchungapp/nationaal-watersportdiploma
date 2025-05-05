"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateLogbook } from "~/lib/nwd";
import { dateInputToIsoString } from "../dates";
import { actionClientWithMeta } from "../safe-action";

const updateLogbookSchema = zfd.formData({
  startedAt: zfd.text(dateInputToIsoString(z.string().datetime().optional())),
  endedAt: zfd.text(
    dateInputToIsoString(z.string().datetime().nullable().optional()),
  ),
  departurePort: zfd.text(z.string().nullable().optional()),
  arrivalPort: zfd.text(z.string().nullable().optional()),
  location: zfd.text(z.string().nullable().optional()),
  windPower: zfd.text(z.coerce.number().nullable().optional()),
  windDirection: zfd.text(z.string().nullable().optional()),
  boatType: zfd.text(z.string().nullable().optional()),
  boatLength: zfd.text(z.coerce.number().nullable().optional()),
  sailedNauticalMiles: zfd.text(z.coerce.number().nullable().optional()),
  sailedHoursInDark: zfd.text(z.coerce.number().nullable().optional()),
  primaryRole: zfd.text(z.string().nullable().optional()),
  crewNames: zfd.text(z.string().nullable().optional()),
  conditions: zfd.text(z.string().nullable().optional()),
  additionalComments: zfd.text(z.string().nullable().optional()),
});

const updateLogbookArgsSchema: [personId: z.ZodString, logbookId: z.ZodString] =
  [z.string().uuid(), z.string().uuid()];

export const updateLogbookAction = actionClientWithMeta
  .metadata({
    name: "update-logbook",
  })
  .schema(updateLogbookSchema)
  .bindArgsSchemas(updateLogbookArgsSchema)
  .action(
    async ({
      parsedInput: data,
      bindArgsParsedInputs: [personId, logbookId],
    }) => {
      await updateLogbook({
        id: logbookId,
        personId,
        fields: data,
      });

      revalidatePath("/profiel/[handle]", "page");
    },
  );
