"use server";
import slugify from "@sindresorhus/slugify";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { validSlugRegex } from "~/lib/nwd";
import { createCompetency } from "~/lib/nwd";

const createCompetencySchema = zfd.formData({
  title: zfd.text(),
  type: zfd.text(z.enum(["skill", "knowledge"])),
  weight: zfd.numeric(z.number().min(0)),
});

const slugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(48, "Slug must be less than 48 characters")
  .transform((v) => slugify(v))
  .refine((v) => validSlugRegex.test(v), { message: "Invalid slug format" });

export const createCompetencyAction = actionClientWithMeta
  .metadata({
    name: "create-competency",
  })
  .schema(createCompetencySchema)
  .action(async ({ parsedInput: { title, type, weight } }) => {
    await createCompetency({
      title,
      type,
      weight,
      handle: slugSchema.parse(title),
    });

    revalidatePath("/", "page");
    revalidateTag("competencies");
  });
