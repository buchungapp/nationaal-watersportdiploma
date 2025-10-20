"use server";
import slugify from "@sindresorhus/slugify";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { createLocation, validSlugRegex } from "~/lib/nwd";

const createLocationSchema = zfd.formData({
  name: zfd.text(),
});

const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(48, "Slug must be less than 48 characters")
  .transform((v) => slugify(v))
  .refine((v) => validSlugRegex.test(v), { message: "Invalid slug format" });

export const createLocationAction = actionClientWithMeta
  .metadata({
    name: "create-location",
  })
  .schema(createLocationSchema)
  .action(async ({ parsedInput: { name } }) => {
    await createLocation({
      name,
      handle: slugSchema.parse(name),
    });

    revalidatePath("/", "page");
    revalidateTag("locations");
  });
