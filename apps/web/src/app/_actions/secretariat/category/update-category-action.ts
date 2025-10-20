"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateCategory } from "~/lib/nwd";
import { actionClientWithMeta } from "../../safe-action";

const updateCategorySchema = zfd.formData({
  title: zfd.text(),
  description: zfd.text(z.string().optional()),
  parentCategoryId: zfd.text(z.string().uuid().nullable().optional()),
  weight: zfd.numeric(z.number().min(0)),
});

const updateCategoryArgsSchema: [categoryId: z.ZodString] = [z.string().uuid()];

export const updateCategoryAction = actionClientWithMeta
  .metadata({
    name: "update-category",
  })
  .schema(updateCategorySchema)
  .bindArgsSchemas(updateCategoryArgsSchema)
  .action(
    async ({
      parsedInput: { title, description, parentCategoryId, weight },
      bindArgsParsedInputs: [categoryId],
    }) => {
      await updateCategory(categoryId, {
        title,
        description,
        parentCategoryId: parentCategoryId || null,
        weight,
      });

      revalidatePath("/", "page");
      revalidateTag("categories");
    },
  );
