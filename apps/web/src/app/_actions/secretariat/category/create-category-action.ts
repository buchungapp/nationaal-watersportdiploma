"use server";
import slugify from "@sindresorhus/slugify";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { createCategory, validSlugRegex } from "~/lib/nwd";

const createCategorySchema = zfd.formData({
  title: zfd.text(),
  description: zfd.text(z.string().optional()),
  parentCategoryId: zfd.text(z.string().uuid().nullable().optional()),
  weight: zfd.numeric(z.number().min(0)),
});

const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(48, "Slug must be less than 48 characters")
  .transform((v) => slugify(v))
  .refine((v) => validSlugRegex.test(v), { message: "Invalid slug format" });

export const createCategoryAction = actionClientWithMeta
  .metadata({
    name: "create-category",
  })
  .schema(createCategorySchema)
  .action(
    async ({
      parsedInput: { title, description, parentCategoryId, weight },
    }) => {
      await createCategory({
        title,
        description,
        parentCategoryId: parentCategoryId || null,
        handle: slugSchema.parse(title),
        weight,
      });

      revalidatePath("/", "page");
      revalidateTag("categories");
    },
  );
