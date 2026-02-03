"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateEmailForPerson } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const updatePersonEmailSchema = zfd.formData({
  email: zfd.text(z.string().email()),
});

const updatePersonEmailArgsSchema: [
  locationId: z.ZodString,
  personId: z.ZodString,
] = [z.string().uuid(), z.string().uuid()];

export const updatePersonEmailAction = actionClientWithMeta
  .metadata({
    name: "update-person-email",
  })
  .inputSchema(updatePersonEmailSchema)
  .bindArgsSchemas(updatePersonEmailArgsSchema)
  .action(
    async ({
      parsedInput: { email },
      bindArgsParsedInputs: [locationId, personId],
    }) => {
      await updateEmailForPerson({
        locationId,
        personId,
        email,
      });

      revalidatePath("/locatie/[location]/personen", "page");
      revalidatePath("/locatie/[location]/personen/[id]", "page");
    },
  );
