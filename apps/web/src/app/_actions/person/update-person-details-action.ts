"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updatePersonDetails } from "~/lib/nwd";
import { dateInput } from "../dates";
import { actionClientWithMeta } from "../safe-action";

const updatePersonDetailsSchema = zfd.formData({
  firstName: zfd.text(z.string().trim()),
  lastNamePrefix: zfd.text(
    z
      .string()
      .trim()
      .nullish()
      .transform((tussenvoegsel) => tussenvoegsel ?? null),
  ),
  lastName: zfd.text(z.string()),
  dateOfBirth: zfd.text(dateInput),
  birthCity: zfd.text(z.string()),
  birthCountry: z.object({
    code: zfd.text(z.string().length(2).toLowerCase()),
  }),
});

const updatePersonDetailsArgsSchema: [
  personId: z.ZodString,
  locationId: z.ZodOptional<z.ZodString>,
] = [z.string().uuid(), z.string().uuid().optional()];

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
        birthCountry: data.birthCountry.code,
      });

      revalidatePath("/profiel/[handle]", "page");
      revalidatePath("/locatie/[location]/personen/[id]", "page");
      revalidatePath(
        "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
        "page",
      );

      revalidatePath("/secretariaat/gebruikers/[personId]", "page");
      revalidatePath("/secretariaat/instructeurs/[personId]", "page");
    },
  );
