"use server";
import slugify from "@sindresorhus/slugify";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { createGearType, validSlugRegex } from "~/lib/nwd";

const createGearTypeSchema = zfd.formData({
  title: zfd.text(),
});

const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(48, "Slug must be less than 48 characters")
  .transform((v) => slugify(v))
  .refine((v) => validSlugRegex.test(v), { message: "Invalid slug format" });

export const createGearTypeAction = actionClientWithMeta
  .metadata({
    name: "create-gear-type",
  })
  .schema(createGearTypeSchema)
  .action(async ({ parsedInput: { title } }) => {
    await createGearType({
      title,
      handle: slugSchema.parse(title),
    });

    revalidatePath("/", "page");
    revalidateTag("gear-types");
  });
