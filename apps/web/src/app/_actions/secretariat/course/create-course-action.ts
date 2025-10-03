"use server";
import slugify from "@sindresorhus/slugify";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { validSlugRegex } from "~/lib/nwd";
import { createCourse } from "~/lib/nwd";

const createCourseSchema = zfd.formData({
  title: zfd.text(),
  description: zfd.text(z.string().optional()),
  disciplineId: zfd.text(z.string().uuid()),
  abbreviation: zfd.text(z.string().optional()),
  categories: zfd.repeatableOfType(zfd.text(z.string().uuid())),
});

const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(48, "Slug must be less than 48 characters")
  .transform((v) => slugify(v))
  .refine((v) => validSlugRegex.test(v), { message: "Invalid slug format" });

export const createCourseAction = actionClientWithMeta
  .metadata({
    name: "create-course",
  })
  .schema(createCourseSchema)
  .action(
    async ({
      parsedInput: {
        title,
        description,
        disciplineId,
        abbreviation,
        categories,
      },
    }) => {
      await createCourse({
        title,
        description,
        disciplineId,
        abbreviation,
        handle: slugSchema.parse(title),
        categories: categories.length > 0 ? categories : undefined,
      });

      revalidatePath("/", "page");
      revalidateTag("courses");
    },
  );
