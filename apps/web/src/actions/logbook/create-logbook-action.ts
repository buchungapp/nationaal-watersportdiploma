"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { createLogbook } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const createLogbookSchema = zfd.formData({
  startedAt: zfd.text(
    z.preprocess(
      (value) => (value ? new Date(String(value)).toISOString() : null),
      z.string().datetime(),
    ),
  ),
  endedAt: zfd.text(
    z.preprocess(
      (value) => (value ? new Date(String(value)).toISOString() : null),
      z.string().datetime().nullable(),
    ),
  ),
  departurePort: zfd.text(z.string().nullable().default(null)),
  arrivalPort: zfd.text(z.string().nullable().default(null)),
  location: zfd.text(z.string().nullable().default(null)),
  windPower: zfd.numeric(z.coerce.number().nullable().default(null)),
  windDirection: zfd.text(z.string().nullable().default(null)),
  boatType: zfd.text(z.string().nullable().default(null)),
  boatLength: zfd.numeric(z.coerce.number().nullable().default(null)),
  sailedNauticalMiles: zfd.numeric(z.coerce.number().nullable().default(null)),
  sailedHoursInDark: zfd.numeric(z.coerce.number().nullable().default(null)),
  primaryRole: zfd.text(z.string().nullable().default(null)),
  crewNames: zfd.text(z.string().nullable().default(null)),
  conditions: zfd.text(z.string().nullable().default(null)),
  additionalComments: zfd.text(z.string().nullable().default(null)),
});

const createLogbookArgsSchema: [personId: z.ZodString] = [z.string().uuid()];

export const createLogbookAction = actionClientWithMeta
  .metadata({
    name: "create-logbook",
  })
  .schema(createLogbookSchema)
  .bindArgsSchemas(createLogbookArgsSchema)
  .action(async ({ parsedInput: data, bindArgsParsedInputs: [personId] }) => {
    await createLogbook({
      personId,
      fields: data,
    });

    revalidatePath("/profiel/[handle]", "page");
  });
