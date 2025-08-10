"use server";
import slugify from "@sindresorhus/slugify";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { validSlugRegex } from "~/lib/nwd";
import { createModule } from "~/lib/nwd";

const createModuleSchema = zfd.formData({
  title: zfd.text(),
  weight: zfd.numeric(z.number().min(0)),
});

const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(48, "Slug must be less than 48 characters")
  .transform((v) => slugify(v))
  .refine((v) => validSlugRegex.test(v), { message: "Invalid slug format" });

export const createModuleAction = actionClientWithMeta
  .metadata({
    name: "create-module",
  })
  .schema(createModuleSchema)
  .action(async ({ parsedInput: { title, weight } }) => {
    await createModule({
      title,
      weight,
      handle: slugSchema.parse(title),
    });

    revalidatePath("/", "page");
    revalidateTag("modules");
  });
