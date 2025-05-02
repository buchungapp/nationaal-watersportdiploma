"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updatePersonDetails } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const updatePersonDetailsSchema = zfd.formData({
  firstName: zfd.text(z.string().trim()),
  lastNamePrefix: zfd.text(
    z.preprocess(
      (tussenvoegsel) => (tussenvoegsel === undefined ? null : tussenvoegsel),
      z.string().trim().nullable(),
    ),
  ),
  lastName: zfd.text(z.string()),
  dateOfBirth: zfd.text(z.string().pipe(z.coerce.date())),
  birthCity: zfd.text(z.string()),
  birthCountry: zfd.text(z.string().length(2).toLowerCase()),
});

const updatePersonDetailsArgsSchema: [
  personId: z.ZodString,
  locationId: z.ZodOptional<z.ZodString>,
] = [z.string(), z.string().uuid().optional()];

export const updatePersonDetailsAction = actionClientWithMeta
  .metadata({
    name: "update-person-details",
  })
  .schema(updatePersonDetailsSchema)
  .bindArgsSchemas(updatePersonDetailsArgsSchema)
  .action(
    async ({
      parsedInput: data,
      bindArgsParsedInputs: [personId, locationId],
    }) => {
      await updatePersonDetails({
        locationId,
        personId,
        ...data,
      });

      revalidatePath("/profiel/[handle]", "page");
    },
  );
