"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateLocationLogos } from "~/lib/nwd";
import { optionalNullableFileSchema } from "../files";
import { actionClientWithMeta } from "../safe-action";

const updateLocationLogosSchema = zfd.formData({
  logo: optionalNullableFileSchema,
  logoSquare: optionalNullableFileSchema,
  logoCertificate: optionalNullableFileSchema,
});

const updateLocationLogosArgsSchema: [locationId: z.ZodString] = [
  z.string().uuid(),
];

export const updateLocationLogosAction = actionClientWithMeta
  .metadata({
    name: "update-location-logos",
  })
  .schema(updateLocationLogosSchema)
  .bindArgsSchemas(updateLocationLogosArgsSchema)
  .action(
    async ({
      parsedInput: { logo, logoSquare, logoCertificate },
      bindArgsParsedInputs: [locationId],
    }) => {
      await updateLocationLogos(locationId, {
        logo,
        logoSquare,
        logoCertificate,
      });

      revalidatePath("/locatie/[location]", "layout");
      revalidateTag("locations");
    },
  );
