"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateLocationDetails } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const updateLocationSettingsSchema = zfd.formData({
  name: zfd.text(),
  websiteUrl: zfd.text(z.string().url()),
  email: zfd.text(z.string().email()),
  shortDescription: zfd.text(
    z
      .string()
      .optional()
      .transform((x) => x ?? null),
  ),
});

const updateLocationSettingsArgsSchema: [locationId: z.ZodString] = [
  z.string().uuid(),
];

export const updateLocationSettingsAction = actionClientWithMeta
  .metadata({ name: "update-location-settings" })
  .schema(updateLocationSettingsSchema)
  .bindArgsSchemas(updateLocationSettingsArgsSchema)
  .action(
    async ({
      parsedInput: { name, websiteUrl, email, shortDescription },
      bindArgsParsedInputs: [locationId],
    }) => {
      await updateLocationDetails(locationId, {
        name,
        websiteUrl,
        email,
        shortDescription,
      });

      revalidatePath("/locatie/[location]", "layout");
      revalidateTag("locations");
    },
  );
