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
  locationId: z.ZodOptional<z.ZodString>,
  personId: z.ZodString,
] = [z.string().uuid().optional(), z.string().uuid()];

export const updatePersonEmailAction = actionClientWithMeta
  .metadata({
    name: "update-person-email",
  })
  .schema(updatePersonEmailSchema)
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

      revalidatePath("/(dashboard)", "page");
    },
  );
