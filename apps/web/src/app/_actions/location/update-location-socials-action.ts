"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import type { SocialPlatform } from "~/lib/nwd";
import { updateLocationDetails } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const updateLocationSocialsSchema = zfd.formData({
  googlePlaceId: zfd.text(
    z
      .string()
      .optional()
      .transform((v) => v ?? null),
  ),
  "socials-facebook": zfd.text(z.string().url().optional()),
  "socials-instagram": zfd.text(z.string().url().optional()),
  "socials-linkedin": zfd.text(z.string().url().optional()),
  "socials-tiktok": zfd.text(z.string().url().optional()),
  "socials-whatsapp": zfd.text(z.string().url().optional()),
  "socials-x": zfd.text(z.string().url().optional()),
  "socials-youtube": zfd.text(z.string().url().optional()),
});

const updateLocationSocialsArgsSchema: [locationId: z.ZodString] = [
  z.string().uuid(),
];

export const updateLocationSocialsAction = actionClientWithMeta
  .metadata({ name: "update-location-socials" })
  .inputSchema(updateLocationSocialsSchema)
  .bindArgsSchemas(updateLocationSocialsArgsSchema)
  .action(
    async ({ parsedInput: parsed, bindArgsParsedInputs: [locationId] }) => {
      const data = {
        socialMedia: Object.entries(parsed)
          .filter(
            ([key]) =>
              key.startsWith("socials-") &&
              !!parsed[key as keyof typeof parsed] &&
              parsed[key as keyof typeof parsed] !== "",
          )
          .map(([key, url]) => ({
            platform: key.replace("socials-", "") as SocialPlatform,
            // biome-ignore lint/style/noNonNullAssertion: intentional
            url: url!,
          })),
        googlePlaceId: parsed.googlePlaceId,
      };

      await updateLocationDetails(locationId, data);

      revalidatePath("/locatie/[location]/instellingen", "page");
      revalidateTag("locations", { expire: 0 });
    },
  );
